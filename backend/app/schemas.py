from __future__ import annotations

from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

Channel = Literal["Search", "Social", "Display", "Email"]
CampaignStatus = Literal["Live", "Paused", "Draft"]
MatchType = Literal["Broad", "Phrase", "Exact"]


class CampaignInput(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    channel: Channel
    status: CampaignStatus
    budget: float = Field(ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    @model_validator(mode="after")
    def dates_are_ordered(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class CampaignOut(CampaignInput):
    id: int
    model_config = ConfigDict(from_attributes=True)


class KeywordInput(BaseModel):
    campaign_id: int
    text: str = Field(min_length=1, max_length=200)
    match_type: MatchType
    max_cpc: float = Field(ge=0)


class KeywordOut(KeywordInput):
    id: int
    model_config = ConfigDict(from_attributes=True)


class DailyMetricInput(BaseModel):
    campaign_id: int
    date: date
    impressions: int = Field(ge=0)
    clicks: int = Field(ge=0)
    spend: float = Field(ge=0)
    conversions: int = Field(ge=0)
    revenue: float = Field(ge=0)

