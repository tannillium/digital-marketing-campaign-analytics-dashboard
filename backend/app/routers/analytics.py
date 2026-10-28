from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campaign, CampaignDailyMetric, Keyword, KeywordDailyMetric
from ..services.metrics import derive_metrics

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def period_totals(db: Session, start: date, end: date, campaign_id: Optional[int] = None):
    statement = select(
        func.coalesce(func.sum(CampaignDailyMetric.spend), 0),
        func.coalesce(func.sum(CampaignDailyMetric.impressions), 0),
        func.coalesce(func.sum(CampaignDailyMetric.clicks), 0),
        func.coalesce(func.sum(CampaignDailyMetric.conversions), 0),
        func.coalesce(func.sum(CampaignDailyMetric.revenue), 0),
    ).where(CampaignDailyMetric.date.between(start, end))
    if campaign_id is not None:
        statement = statement.where(CampaignDailyMetric.campaign_id == campaign_id)
    spend, impressions, clicks, conversions, revenue = db.execute(statement).one()
    return {"spend": round(spend, 2), "impressions": impressions, "clicks": clicks, "conversions": conversions, "revenue": round(revenue, 2), **derive_metrics(spend, impressions, clicks, conversions, revenue)}


def date_range(start: Optional[date], end: Optional[date]):
    end = end or date.today()
    start = start or end - timedelta(days=29)
    if end < start:
        raise HTTPException(422, "end must be on or after start")
    return start, end


@router.get("/summary")
def summary(start: Optional[date] = None, end: Optional[date] = None, compare: bool = False, db: Session = Depends(get_db)):
    start, end = date_range(start, end)
    current = period_totals(db, start, end)
    previous = None
    changes = None
    if compare:
        days = (end - start).days + 1
        previous = period_totals(db, start - timedelta(days=days), start - timedelta(days=1))
        changes = {}
        for key in ("spend", "impressions", "clicks", "conversions", "cpl"):
            before, now = previous.get(key), current.get(key)
            changes[key] = round((now - before) / abs(before) * 100, 2) if before not in (None, 0) and now is not None else None
    return {"period": {"start": str(start), "end": str(end)}, "current": current, "previous": previous, "changes": changes}


@router.get("/trends")
def trends(start: Optional[date] = None, end: Optional[date] = None, campaign_id: Optional[int] = None, db: Session = Depends(get_db)):
    start, end = date_range(start, end)
    statement = select(
        CampaignDailyMetric.date,
        func.sum(CampaignDailyMetric.spend).label("spend"),
        func.sum(CampaignDailyMetric.impressions).label("impressions"),
        func.sum(CampaignDailyMetric.clicks).label("clicks"),
        func.sum(CampaignDailyMetric.conversions).label("conversions"),
    ).where(CampaignDailyMetric.date.between(start, end)).group_by(CampaignDailyMetric.date).order_by(CampaignDailyMetric.date)
    if campaign_id is not None:
        statement = statement.where(CampaignDailyMetric.campaign_id == campaign_id)
    return [{"date": str(row.date), "spend": round(row.spend, 2), "impressions": row.impressions, "clicks": row.clicks, "conversions": row.conversions} for row in db.execute(statement)]


@router.get("/campaigns")
def campaign_analytics(start: Optional[date] = None, end: Optional[date] = None, channel: Optional[str] = None, db: Session = Depends(get_db)):
    start, end = date_range(start, end)
    spend_to_date = select(func.coalesce(func.sum(CampaignDailyMetric.spend), 0)).where(CampaignDailyMetric.campaign_id == Campaign.id, CampaignDailyMetric.date <= date.today()).correlate(Campaign).scalar_subquery()
    statement = select(Campaign, func.coalesce(func.sum(CampaignDailyMetric.spend), 0).label("spend"), func.coalesce(func.sum(CampaignDailyMetric.impressions), 0).label("impressions"), func.coalesce(func.sum(CampaignDailyMetric.clicks), 0).label("clicks"), func.coalesce(func.sum(CampaignDailyMetric.conversions), 0).label("conversions"), func.coalesce(func.sum(CampaignDailyMetric.revenue), 0).label("revenue"), spend_to_date.label("spend_to_date")).outerjoin(CampaignDailyMetric, (Campaign.id == CampaignDailyMetric.campaign_id) & CampaignDailyMetric.date.between(start, end)).group_by(Campaign.id).order_by(Campaign.name)
    if channel:
        statement = statement.where(Campaign.channel == channel)
    result = []
    for row in db.execute(statement):
        data = {"id": row.Campaign.id, "name": row.Campaign.name, "channel": row.Campaign.channel, "status": row.Campaign.status, "budget": row.Campaign.budget, "start_date": row.Campaign.start_date, "end_date": row.Campaign.end_date, "spend": round(row.spend, 2), "spend_to_date": round(row.spend_to_date, 2), "impressions": row.impressions, "clicks": row.clicks, "conversions": row.conversions, "revenue": round(row.revenue, 2)}
        data.update(derive_metrics(data["spend"], data["impressions"], data["clicks"], data["conversions"], data["revenue"]))
        result.append(data)
    return result


@router.get("/channels")
def channel_analytics(start: Optional[date] = None, end: Optional[date] = None, db: Session = Depends(get_db)):
    start, end = date_range(start, end)
    rows = db.execute(select(Campaign.channel, func.count(func.distinct(Campaign.id)).label("campaign_count"), func.coalesce(func.sum(CampaignDailyMetric.spend), 0).label("spend"), func.coalesce(func.sum(CampaignDailyMetric.impressions), 0).label("impressions"), func.coalesce(func.sum(CampaignDailyMetric.clicks), 0).label("clicks"), func.coalesce(func.sum(CampaignDailyMetric.conversions), 0).label("conversions"), func.coalesce(func.sum(CampaignDailyMetric.revenue), 0).label("revenue")).outerjoin(CampaignDailyMetric, (Campaign.id == CampaignDailyMetric.campaign_id) & CampaignDailyMetric.date.between(start, end)).group_by(Campaign.channel).order_by(Campaign.channel))
    result = []
    for row in rows:
        data = {"channel": row.channel, "campaign_count": row.campaign_count, "spend": round(row.spend, 2), "impressions": row.impressions, "clicks": row.clicks, "conversions": row.conversions, "revenue": round(row.revenue, 2)}
        data.update(derive_metrics(data["spend"], data["impressions"], data["clicks"], data["conversions"], data["revenue"]))
        result.append(data)
    return result


@router.get("/keywords")
def keyword_analytics(start: Optional[date] = None, end: Optional[date] = None, min_clicks: int = Query(0, ge=0), db: Session = Depends(get_db)):
    start, end = date_range(start, end)
    statement = select(Keyword, Campaign.name.label("campaign_name"), func.coalesce(func.sum(KeywordDailyMetric.impressions), 0).label("impressions"), func.coalesce(func.sum(KeywordDailyMetric.clicks), 0).label("clicks"), func.coalesce(func.sum(KeywordDailyMetric.spend), 0).label("spend"), func.coalesce(func.sum(KeywordDailyMetric.conversions), 0).label("conversions")).join(Campaign).outerjoin(KeywordDailyMetric, (Keyword.id == KeywordDailyMetric.keyword_id) & KeywordDailyMetric.date.between(start, end)).group_by(Keyword.id, Campaign.name).order_by(Keyword.text)
    result = []
    for row in db.execute(statement):
        if row.clicks < min_clicks:
            continue
        data = {"id": row.Keyword.id, "campaign_id": row.Keyword.campaign_id, "campaign_name": row.campaign_name, "text": row.Keyword.text, "match_type": row.Keyword.match_type, "max_cpc": row.Keyword.max_cpc, "impressions": row.impressions, "clicks": row.clicks, "spend": round(row.spend, 2), "conversions": row.conversions}
        data.update(derive_metrics(data["spend"], data["impressions"], data["clicks"], data["conversions"], 0))
        result.append(data)
    return result
