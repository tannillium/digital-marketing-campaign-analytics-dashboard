from __future__ import annotations

from datetime import date
from typing import Optional

from sqlalchemy import Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), index=True)
    channel: Mapped[str] = mapped_column(String(30), index=True)
    status: Mapped[str] = mapped_column(String(20), default="Live", index=True)
    budget: Mapped[float] = mapped_column(Float, default=0)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    daily_metrics: Mapped[list["CampaignDailyMetric"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")
    keywords: Mapped[list["Keyword"]] = relationship(back_populates="campaign", cascade="all, delete-orphan")


class CampaignDailyMetric(Base):
    __tablename__ = "campaign_daily_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    spend: Mapped[float] = mapped_column(Float, default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    revenue: Mapped[float] = mapped_column(Float, default=0)

    campaign: Mapped[Campaign] = relationship(back_populates="daily_metrics")


class Keyword(Base):
    __tablename__ = "keywords"

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"), index=True)
    text: Mapped[str] = mapped_column(String(200), index=True)
    match_type: Mapped[str] = mapped_column(String(20), default="Exact")
    max_cpc: Mapped[float] = mapped_column(Float, default=0)

    campaign: Mapped[Campaign] = relationship(back_populates="keywords")
    daily_metrics: Mapped[list["KeywordDailyMetric"]] = relationship(back_populates="keyword", cascade="all, delete-orphan")


class KeywordDailyMetric(Base):
    __tablename__ = "keyword_daily_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    keyword_id: Mapped[int] = mapped_column(ForeignKey("keywords.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    clicks: Mapped[int] = mapped_column(Integer, default=0)
    spend: Mapped[float] = mapped_column(Float, default=0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)

    keyword: Mapped[Keyword] = relationship(back_populates="daily_metrics")
