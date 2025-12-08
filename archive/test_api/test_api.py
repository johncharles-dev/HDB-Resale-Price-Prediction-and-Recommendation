"""
HDB Price Prediction API Tests
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "running"


def test_health():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert "status" in response.json()


def test_predict_basic():
    """Test basic prediction"""
    payload = {
        "town": "BEDOK",
        "flat_type": "4 ROOM",
        "flat_model": "Improved",
        "storey_range": "07 TO 09",
        "floor_area_sqm": 95,
        "lease_commence_year": 1995
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_price" in data
    assert "price_lower" in data
    assert "price_upper" in data
    assert data["predicted_price"] > 0


def test_predict_different_towns():
    """Test predictions for different towns"""
    towns = ["BEDOK", "ANG MO KIO", "TAMPINES", "QUEENSTOWN"]
    for town in towns:
        payload = {
            "town": town,
            "flat_type": "4 ROOM",
            "flat_model": "Improved",
            "storey_range": "07 TO 09",
            "floor_area_sqm": 95,
            "lease_commence_year": 1995
        }
        response = client.post("/predict", json=payload)
        assert response.status_code == 200


def test_predict_multi_year():
    """Test multi-year prediction"""
    payload = {
        "town": "BEDOK",
        "flat_type": "4 ROOM",
        "flat_model": "Improved",
        "storey_range": "07 TO 09",
        "floor_area_sqm": 95,
        "lease_commence_year": 1995,
        "years": [2024, 2025, 2026]
    }
    response = client.post("/predict/multi-year", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["predictions"]) == 3


def test_get_towns():
    """Test towns endpoint"""
    response = client.get("/towns")
    assert response.status_code == 200
    assert len(response.json()["towns"]) > 0


def test_get_flat_types():
    """Test flat types endpoint"""
    response = client.get("/flat-types")
    assert response.status_code == 200
    assert len(response.json()["flat_types"]) > 0


def test_invalid_floor_area():
    """Test validation for invalid floor area"""
    payload = {
        "town": "BEDOK",
        "flat_type": "4 ROOM",
        "flat_model": "Improved",
        "storey_range": "07 TO 09",
        "floor_area_sqm": -10,  # Invalid
        "lease_commence_year": 1995
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 422  # Validation error
