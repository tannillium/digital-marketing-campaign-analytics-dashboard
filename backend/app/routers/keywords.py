from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Campaign, Keyword
from ..schemas import KeywordInput, KeywordOut

router = APIRouter(prefix="/api/keywords", tags=["keywords"])


@router.get("", response_model=list[KeywordOut])
def list_keywords(db: Session = Depends(get_db)):
    return list(db.scalars(select(Keyword).order_by(Keyword.text)).all())


@router.post("", response_model=KeywordOut, status_code=201)
def create_keyword(payload: KeywordInput, db: Session = Depends(get_db)):
    if not db.get(Campaign, payload.campaign_id):
        raise HTTPException(422, "campaign_id does not match an existing campaign")
    row = Keyword(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{keyword_id}", response_model=KeywordOut)
def update_keyword(keyword_id: int, payload: KeywordInput, db: Session = Depends(get_db)):
    row = db.get(Keyword, keyword_id)
    if not row:
        raise HTTPException(404, "Keyword not found")
    if not db.get(Campaign, payload.campaign_id):
        raise HTTPException(422, "campaign_id does not match an existing campaign")
    for key, value in payload.model_dump().items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{keyword_id}", status_code=204)
def delete_keyword(keyword_id: int, db: Session = Depends(get_db)):
    row = db.get(Keyword, keyword_id)
    if not row:
        raise HTTPException(404, "Keyword not found")
    db.delete(row)
    db.commit()
