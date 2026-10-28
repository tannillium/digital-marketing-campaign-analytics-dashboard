from __future__ import annotations

import csv
import io
import logging
import math
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campaign, CampaignDailyMetric, Keyword, KeywordDailyMetric
from .analytics import campaign_analytics, date_range, keyword_analytics

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["reports"])


def csv_response(filename: str, headers: list[str], rows: list[list]):
    stream = io.StringIO(newline="")
    writer = csv.writer(stream)
    writer.writerow(headers)
    writer.writerows(rows)
    return Response(stream.getvalue(), media_type="text/csv", headers={"Content-Disposition": f'attachment; filename="{filename}"'})


@router.get("/reports/campaigns.csv")
def export_campaigns(start: Optional[date] = None, end: Optional[date] = None, channel: Optional[str] = None, campaign_id: Optional[int] = None, db: Session = Depends(get_db)):
    rows = campaign_analytics(start, end, channel, db)
    if campaign_id is not None:
        rows = [row for row in rows if row["id"] == campaign_id]
    headers = ["id", "name", "channel", "status", "budget", "spend", "impressions", "clicks", "ctr", "cpc", "conversions", "cpl", "roas"]
    return csv_response("campaigns.csv", headers, [[row.get(key) for key in headers] for row in rows])


@router.get("/reports/keywords.csv")
def export_keywords(start: Optional[date] = None, end: Optional[date] = None, channel: Optional[str] = None, campaign_id: Optional[int] = None, db: Session = Depends(get_db)):
    keywords = keyword_analytics(start, end, 0, db)
    if campaign_id is not None:
        keywords = [row for row in keywords if row["campaign_id"] == campaign_id]
    if channel:
        campaign_ids = set(db.scalars(select(Campaign.id).where(Campaign.channel == channel)).all())
        keywords = [row for row in keywords if row["campaign_id"] in campaign_ids]
    headers = ["id", "campaign_id", "campaign_name", "text", "match_type", "max_cpc", "impressions", "clicks", "ctr", "conversions", "conversion_rate", "spend"]
    return csv_response("keywords.csv", headers, [[row.get(key) for key in headers] for row in keywords])


@router.get("/reports/daily-metrics.csv")
def export_daily_metrics(start: Optional[date] = None, end: Optional[date] = None, campaign_id: Optional[int] = None, channel: Optional[str] = None, db: Session = Depends(get_db)):
    start, end = date_range(start, end)
    statement = select(CampaignDailyMetric, Campaign.name, Campaign.channel).join(Campaign).where(CampaignDailyMetric.date.between(start, end)).order_by(CampaignDailyMetric.date, Campaign.name)
    if campaign_id is not None:
        statement = statement.where(CampaignDailyMetric.campaign_id == campaign_id)
    if channel:
        statement = statement.where(Campaign.channel == channel)
    headers = ["date", "campaign_id", "campaign", "channel", "impressions", "clicks", "spend", "conversions", "revenue"]
    rows = [[metric.date, metric.campaign_id, name, channel_name, metric.impressions, metric.clicks, metric.spend, metric.conversions, metric.revenue] for metric, name, channel_name in db.execute(statement)]
    return csv_response("daily-metrics.csv", headers, rows)


@router.post("/metrics/import")
async def import_metrics(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(400, detail={"message": "Upload a CSV file.", "errors": []})
    try:
        text = (await file.read()).decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(400, detail={"message": "CSV must use UTF-8 encoding.", "errors": []}) from exc
    reader = csv.DictReader(io.StringIO(text))
    required = {"campaign_id", "date", "impressions", "clicks", "spend", "conversions", "revenue"}
    if not reader.fieldnames or not required.issubset(reader.fieldnames):
        missing = sorted(required - set(reader.fieldnames or []))
        raise HTTPException(422, detail={"message": "CSV is missing required columns.", "errors": [f"Missing columns: {', '.join(missing)}"]})

    prepared = []
    errors = []
    for line_number, row in enumerate(reader, start=2):
        try:
            campaign_id = int(row["campaign_id"])
            if not db.get(Campaign, campaign_id):
                raise ValueError(f"Unknown campaign_id {campaign_id}")
            metric_date = date.fromisoformat(row["date"])
            values = {key: float(row[key]) if key in {"spend", "revenue"} else int(row[key]) for key in ("impressions", "clicks", "spend", "conversions", "revenue")}
            if any(not math.isfinite(value) or value < 0 for value in values.values()):
                raise ValueError("Metrics must be non-negative")
            prepared.append(CampaignDailyMetric(campaign_id=campaign_id, date=metric_date, **values))
        except (ValueError, TypeError) as exc:
            errors.append(f"Row {line_number}: {exc}")
    if errors:
        logger.warning("Rejected metrics CSV with %d invalid rows", len(errors))
        raise HTTPException(422, detail={"message": "No rows were imported. Fix the listed CSV errors and retry.", "errors": errors})
    if not prepared:
        raise HTTPException(422, detail={"message": "The CSV contains no data rows.", "errors": []})
    db.add_all(prepared)
    db.commit()
    return {"imported": len(prepared), "message": f"Imported {len(prepared)} daily metric rows."}
