from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models import Campaign, CampaignDailyMetric, Keyword, KeywordDailyMetric


def test_campaign_and_daily_csv_endpoints():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_get_db():
        with TestSession() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestSession() as db:
            campaign = Campaign(name="CSV test campaign", channel="Search", status="Live", budget=500)
            db.add(campaign)
            db.flush()
            db.add(CampaignDailyMetric(campaign_id=campaign.id, date=date(2026, 1, 5), impressions=1000, clicks=50, spend=75, conversions=5, revenue=250))
            keyword = Keyword(campaign_id=campaign.id, text="analytics platform", match_type="Exact", max_cpc=12)
            db.add(keyword)
            db.flush()
            db.add(KeywordDailyMetric(keyword_id=keyword.id, date=date(2026, 1, 5), impressions=120, clicks=12, spend=24, conversions=3))
            db.commit()
            campaign_id = campaign.id

        client = TestClient(app)
        response = client.get("/api/reports/campaigns.csv", params={"start": "2026-01-05", "end": "2026-01-05", "campaign_id": campaign_id})
        assert response.status_code == 200
        assert "CSV test campaign" in response.text
        assert "75.0" in response.text

        response = client.get("/api/reports/daily-metrics.csv", params={"start": "2026-01-05", "end": "2026-01-05", "campaign_id": campaign_id})
        assert response.status_code == 200
        assert "2026-01-05" in response.text
        assert "1000,50,75.0,5,250.0" in response.text

        response = client.get("/api/reports/keywords.csv", params={"start": "2026-01-05", "end": "2026-01-05", "campaign_id": campaign_id})
        assert response.status_code == 200
        assert "analytics platform" in response.text
        assert "120,12,10.0,3,25.0,24.0" in response.text
    finally:
        app.dependency_overrides.clear()
        Base.metadata.drop_all(engine)
        engine.dispose()
