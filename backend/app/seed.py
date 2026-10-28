import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from .models import Campaign, CampaignDailyMetric, Keyword, KeywordDailyMetric

CHANNELS = ["Search", "Social", "Display", "Email"]
CAMPAIGN_NAMES = [
    "Northstar Search", "Summer Social Launch", "Retargeting Core", "Weekly Product Digest",
    "Brand Search Always On", "B2B Pipeline Builder", "Display Prospecting", "Customer Winback",
    "Mobile App Acquisition", "Seasonal Offers", "Partner Lead Program", "Product Education",
]
KEYWORD_TOPICS = ["digital marketing", "campaign analytics", "growth strategy", "lead generation", "marketing agency", "customer acquisition", "online advertising", "conversion optimization", "brand awareness", "marketing automation"]


def seed_database(db: Session) -> None:
    if db.query(Campaign).first():
        return

    rng = random.Random(42)
    today = date.today()
    for index, name in enumerate(CAMPAIGN_NAMES):
        channel = CHANNELS[index % len(CHANNELS)]
        budget = 18000 + index * 3200
        campaign = Campaign(
            name=name,
            channel=channel,
            status="Paused" if index in {3, 8} else "Live",
            budget=budget,
            start_date=today - timedelta(days=120),
            end_date=today + timedelta(days=35),
        )
        db.add(campaign)
        db.flush()
        for day_offset in range(90):
            metric_date = today - timedelta(days=89 - day_offset)
            weekday_factor = 0.68 if metric_date.weekday() >= 5 else 1.0
            variation = 0.78 + ((day_offset * 7 + index * 11) % 43) / 100
            impressions = int((950 + index * 125) * weekday_factor * variation)
            clicks = int(impressions * (0.025 + (index % 4) * 0.004))
            spend = round(clicks * (16 + index * 1.7) * (0.9 + variation / 5), 2)
            conversions = max(0, int(clicks * (0.035 + (index % 3) * 0.012)))
            revenue = round(conversions * (245 + index * 24), 2)
            db.add(CampaignDailyMetric(campaign_id=campaign.id, date=metric_date, impressions=impressions, clicks=clicks, spend=spend, conversions=conversions, revenue=revenue))

        for keyword_index in range(5):
            topic = KEYWORD_TOPICS[(index + keyword_index * 2) % len(KEYWORD_TOPICS)]
            keyword = Keyword(
                campaign_id=campaign.id,
                text=f"{topic} {['services', 'software', 'company', 'solutions', 'near me'][(index + keyword_index) % 5]}",
                match_type=["Exact", "Phrase", "Broad"][(index + keyword_index) % 3],
                max_cpc=round(18 + rng.random() * 68, 2),
            )
            db.add(keyword)
            db.flush()
            for day_offset in range(90):
                metric_date = today - timedelta(days=89 - day_offset)
                weekday_factor = 0.62 if metric_date.weekday() >= 5 else 1.0
                impressions = int((35 + keyword_index * 14 + (index % 4) * 9) * weekday_factor * (0.75 + rng.random() * 0.5))
                clicks = min(impressions, int(impressions * (0.025 + keyword_index * 0.008)))
                spend = round(clicks * keyword.max_cpc * 0.68, 2)
                conversions = int(clicks * (0.03 + ((index + keyword_index) % 5) * 0.018))
                db.add(KeywordDailyMetric(keyword_id=keyword.id, date=metric_date, impressions=impressions, clicks=clicks, spend=spend, conversions=conversions))
    db.commit()
