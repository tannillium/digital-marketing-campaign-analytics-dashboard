from backend.app.services.metrics import derive_metrics, safe_divide


def test_metric_calculations():
    result = derive_metrics(spend=120, impressions=2000, clicks=100, conversions=10, revenue=360)
    assert result == {"ctr": 5.0, "cpc": 1.2, "conversion_rate": 10.0, "cpl": 12.0, "roas": 3.0}


def test_zero_denominators_are_unavailable():
    assert safe_divide(1, 0) is None
    assert derive_metrics(0, 0, 0, 0, 0) == {"ctr": None, "cpc": None, "conversion_rate": None, "cpl": None, "roas": None}
