from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campaign
from ..schemas import CampaignInput, CampaignOut

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("", response_model=list[CampaignOut])
def list_campaigns(db: Session = Depends(get_db)):
    return list(db.scalars(select(Campaign).order_by(Campaign.name)).all())


@router.post("", response_model=CampaignOut, status_code=201)
def create_campaign(payload: CampaignInput, db: Session = Depends(get_db)):
    row = Campaign(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/{campaign_id}", response_model=CampaignOut)
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    row = db.get(Campaign, campaign_id)
    if not row:
        raise HTTPException(404, "Campaign not found")
    return row


@router.put("/{campaign_id}", response_model=CampaignOut)
def update_campaign(campaign_id: int, payload: CampaignInput, db: Session = Depends(get_db)):
    row = db.get(Campaign, campaign_id)
    if not row:
        raise HTTPException(404, "Campaign not found")
    for key, value in payload.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{campaign_id}", status_code=204)
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    row = db.get(Campaign, campaign_id)
    if not row:
        raise HTTPException(404, "Campaign not found")
    db.delete(row)
    db.commit()
