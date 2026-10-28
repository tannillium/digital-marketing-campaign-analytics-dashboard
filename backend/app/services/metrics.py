from __future__ import annotations
from typing import Optional

LEADS_PER_CONVERSION = 1


def safe_divide(numerator: float, denominator: float) -> Optional[float]:
    if not denominator:
        return None
    return round(numerator / denominator, 4)


def derive_metrics(spend: float, impressions: int, clicks: int, conversions: int, revenue: float) -> dict:
    return {
        "ctr": safe_divide(clicks * 100, impressions),
        "cpc": safe_divide(spend, clicks),
        "conversion_rate": safe_divide(conversions * 100, clicks),
        "cpl": safe_divide(spend, conversions * LEADS_PER_CONVERSION),
        "roas": safe_divide(revenue, spend),
    }
