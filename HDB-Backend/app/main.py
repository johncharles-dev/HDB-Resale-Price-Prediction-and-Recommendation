"""
HDB Price Prediction API - Hybrid Model Version
================================================
FastAPI backend with XGBoost + Prophet hybrid model for future predictions.

Run (single worker): uvicorn app.main:app --reload --port 8000
Run (production):    uvicorn app.main:app --workers 4 --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import joblib
import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree
from pathlib import Path
from datetime import datetime
import json
import httpx
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import hashlib

# Import recommendation module
from app.recommendation import generate_recommendations, parse_destinations

# Thread pool for CPU-bound tasks (allows concurrent processing)
# Adjust based on expected concurrent users and CPU cores
import os
CPU_CORES = os.cpu_count() or 4
THREAD_WORKERS = min(32, CPU_CORES * 4)  # Up to 32 workers
executor = ThreadPoolExecutor(max_workers=THREAD_WORKERS)

# ============================================
# APP SETUP
# ============================================

app = FastAPI(
    title="HDB Price Prediction API",
    description="Hybrid ML model (XGBoost + Prophet) for HDB resale price prediction",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# PATH CONFIGURATION
# ============================================

BASE_DIR = Path(__file__).parent.parent  # hdb-backend/

# Model files (HYBRID)
MODEL_PATH = BASE_DIR / "app" / "models" / "xgb_hybrid_base.joblib"
TREND_PATH = BASE_DIR / "app" / "models" / "trend_multipliers.json"
FEATURES_PATH = BASE_DIR / "app" / "models" / "hybrid_model_features.json"

# Data files
MAPPINGS_PATH = BASE_DIR / "app" / "data" / "mappings"
AMENITIES_PATH = BASE_DIR / "app" / "data" / "amenities"
DATA_PATH = BASE_DIR / "app" / "data"  # For HDB dataset

# ============================================
# GLOBAL RESOURCES
# ============================================

model = None
trend_multipliers = None
model_features = None
mappings = None
amenity_data = None
location_data = None  # Schools and POIs for dropdowns
hdb_data = None  # Real HDB transaction dataset

# Town to Region mapping (CCR=0, RCR=1, OCR=2)
TOWN_TO_REGION = {
    'BUKIT TIMAH': 0, 'CENTRAL AREA': 0, 'MARINE PARADE': 0,
    'BISHAN': 1, 'BUKIT MERAH': 1, 'GEYLANG': 1, 'KALLANG/WHAMPOA': 1,
    'QUEENSTOWN': 1, 'TOA PAYOH': 1, 'SERANGOON': 1,
    'ANG MO KIO': 2, 'BEDOK': 2, 'BUKIT BATOK': 2, 'BUKIT PANJANG': 2,
    'CHOA CHU KANG': 2, 'CLEMENTI': 2, 'HOUGANG': 2, 'JURONG EAST': 2,
    'JURONG WEST': 2, 'PASIR RIS': 2, 'PUNGGOL': 2, 'SEMBAWANG': 2,
    'SENGKANG': 2, 'TAMPINES': 2, 'WOODLANDS': 2, 'YISHUN': 2,
}

# ============================================
# HELPER FUNCTIONS
# ============================================

def get_nearest_distance(lat, lon, amenity_coords):
    """Calculate distance to nearest amenity using BallTree + Haversine"""
    if len(amenity_coords) == 0:
        return 0.0
    hdb_radians = np.radians([[lat, lon]])
    amenity_radians = np.radians(amenity_coords)
    tree = BallTree(amenity_radians, metric='haversine')
    distance, _ = tree.query(hdb_radians, k=1)
    return distance[0][0] * 6371


def calculate_all_distances(lat: float, lon: float) -> dict:
    """Calculate distances from coordinates to all amenity types"""
    return {
        'distance_to_nearest_primary_school_km': get_nearest_distance(lat, lon, amenity_data['primary_schools']),
        'distance_to_nearest_high_value_school_km': get_nearest_distance(lat, lon, amenity_data['high_value_schools']),
        'distance_to_nearest_mrt_km': get_nearest_distance(lat, lon, amenity_data['mrt_stations']),
        'distance_to_nearest_hawker_km': get_nearest_distance(lat, lon, amenity_data['hawker_centers']),
        'distance_to_nearest_mall_km': get_nearest_distance(lat, lon, amenity_data['malls']),
        'distance_to_cbd_km': get_nearest_distance(lat, lon, amenity_data['cbd'])
    }


def get_trend_multiplier(year: int) -> float:
    """Get Prophet trend multiplier for a given year"""
    return trend_multipliers.get(str(year), trend_multipliers.get(str(2030), 1.0))


def load_mappings():
    """Load all mapping CSVs"""
    print(f"Loading mappings from: {MAPPINGS_PATH}")
    return {
        'town': pd.read_csv(MAPPINGS_PATH / 'town_code_map.csv'),
        'flat_type': pd.read_csv(MAPPINGS_PATH / 'flat_type_int_map.csv'),
        'flat_model': pd.read_csv(MAPPINGS_PATH / 'flat_model_code_map.csv'),
        'region': pd.read_csv(MAPPINGS_PATH / 'region_code_map.csv'),
    }


def load_amenity_data():
    """Load all amenity datasets"""
    print(f"Loading amenities from: {AMENITIES_PATH}")
    
    def load_coords(filename):
        filepath = AMENITIES_PATH / filename
        if filepath.exists():
            df = pd.read_csv(filepath)
            return df[['latitude', 'longitude']].values
        else:
            print(f"  |!| File not found: {filename}")
            return np.array([])
    
    return {
        'primary_schools': load_coords('Primary_school_dataset.csv'),
        'high_value_schools': load_coords('Ballot_school.csv'),
        'mrt_stations': load_coords('MRT_datasets.csv'),
        'hawker_centers': load_coords('Hawker_Centers_datasets.csv'),
        'malls': load_coords('Malls_datasets.csv'),
        'cbd': load_coords('singapore_business_district.csv'),
    }


def load_location_data():
    """Load schools and POIs for dropdown options"""
    print(f"Loading location data from: {AMENITIES_PATH}")
    
    data = {
        'schools': [],
        'pois': {},
        'poi_categories': []
    }
    
    # Load primary schools
    schools_path = AMENITIES_PATH / 'Primary_school_dataset.csv'
    if schools_path.exists():
        df = pd.read_csv(schools_path)
        data['schools'] = df.to_dict('records')
        print(f"  [OK] Loaded {len(data['schools'])} schools")
    
    # Load POIs
    poi_path = AMENITIES_PATH / 'singapore_poi.csv'
    if poi_path.exists():
        df = pd.read_csv(poi_path)
        # Clean up Windows line endings if any
        df.columns = df.columns.str.strip()
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].str.strip()
        
        # Group by category
        categories = df['category'].unique().tolist()
        data['poi_categories'] = sorted([c for c in categories if c and c != 'category'])
        
        for cat in data['poi_categories']:
            cat_df = df[df['category'] == cat][['name', 'lat', 'lon']].drop_duplicates(subset=['name'])
            data['pois'][cat] = cat_df.to_dict('records')
        
        total_pois = sum(len(v) for v in data['pois'].values())
        print(f"  [OK] Loaded {total_pois} POIs in {len(data['poi_categories'])} categories")
    
    return data


# ============================================
# STARTUP
# ============================================

@app.on_event("startup")
async def load_resources():
    global model, trend_multipliers, model_features, mappings, amenity_data, location_data, hdb_data
    
    print("=" * 60)
    print("HDB Price Prediction API - HYBRID MODEL")
    print("=" * 60)
    
    # Load XGBoost model
    try:
        model = joblib.load(MODEL_PATH)
        print(f"[OK] XGBoost model loaded: {MODEL_PATH}")
    except Exception as e:
        print(f"X Error loading model: {e}")
        raise e
    
    # Load trend multipliers (Prophet)
    try:
        with open(TREND_PATH) as f:
            trend_multipliers = json.load(f)
        print(f"[OK] Trend multipliers loaded: {len(trend_multipliers)} years")
        print(f"  Years: {list(trend_multipliers.keys())}")
    except Exception as e:
        print(f"X Error loading trend multipliers: {e}")
        raise e
    
    # Load feature config (optional)
    try:
        if FEATURES_PATH.exists():
            with open(FEATURES_PATH) as f:
                model_features = json.load(f)
            print(f"[OK] Feature config loaded")
    except Exception as e:
        print(f"|!| Feature config not loaded: {e}")
    
    # Load mappings
    try:
        mappings = load_mappings()
        print(f"[OK] Mappings loaded: {len(mappings['town'])} towns")
    except Exception as e:
        print(f"X Error loading mappings: {e}")
        raise e
    
    # Load amenity data
    try:
        amenity_data = load_amenity_data()
        print(f"[OK] Amenities loaded")
    except Exception as e:
        print(f"X Error loading amenities: {e}")
        raise e
    
    # Load location data for dropdowns
    try:
        location_data = load_location_data()
        print(f"[OK] Location data loaded")
    except Exception as e:
        print(f"|!| Location data not loaded: {e}")
        location_data = {'schools': [], 'pois': {}, 'poi_categories': []}
    
    # Load HDB transaction data for recommendations
    try:
        hdb_dataset_path = DATA_PATH / "Complete_HDB_resale_dataset_2015_to_2025.csv"
        if hdb_dataset_path.exists():
            hdb_data = pd.read_csv(hdb_dataset_path)
            # Parse remaining lease
            if 'remaining_lease' in hdb_data.columns and hdb_data['remaining_lease'].dtype == 'object':
                import re
                def parse_lease(lease_str):
                    if pd.isna(lease_str):
                        return None
                    if isinstance(lease_str, (int, float)):
                        return float(lease_str)
                    match = re.match(r'(\d+)\s*years?(?:\s*(\d+)\s*months?)?', str(lease_str))
                    if match:
                        years = int(match.group(1))
                        months = int(match.group(2)) if match.group(2) else 0
                        return years + months / 12
                    return None
                hdb_data['remaining_lease_years'] = hdb_data['remaining_lease'].apply(parse_lease)
            else:
                hdb_data['remaining_lease_years'] = hdb_data.get('remaining_lease', 99)
            
            hdb_data['latitude'] = pd.to_numeric(hdb_data['latitude'], errors='coerce')
            hdb_data['longitude'] = pd.to_numeric(hdb_data['longitude'], errors='coerce')
            hdb_data['town'] = hdb_data['town'].str.upper().str.strip()
            hdb_data['flat_type'] = hdb_data['flat_type'].str.upper().str.strip()
            print(f"[OK] HDB dataset loaded: {len(hdb_data)} transactions")
        else:
            print(f"|!| HDB dataset not found at {hdb_dataset_path}")
            print(f"    Place your Complete_HDB_resale_dataset.csv in {DATA_PATH}")
            hdb_data = None
    except Exception as e:
        print(f"|!| HDB dataset not loaded: {e}")
        hdb_data = None
    
    print("=" * 60)
    print("[OK] All resources loaded - HYBRID MODEL READY")
    print(f"[OK] CPU cores detected: {CPU_CORES}")
    print(f"[OK] Thread pool: {THREAD_WORKERS} workers for concurrent requests")
    print(f"[OK] Cache size: {_cache_max_size} entries")
    print("=" * 60)


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class PredictionRequest(BaseModel):
    block: str = Field(..., example="112A")
    street: str = Field(..., example="Depot Road")
    town: str = Field(..., example="BUKIT MERAH")
    flat_type: str = Field(..., example="4 ROOM")
    flat_model: str = Field(..., example="Model A")
    floor_area_sqm: float = Field(..., ge=20, le=300, example=100.0)
    floor_level: int = Field(..., ge=1, le=50, example=10)
    lease_commence_year: int = Field(..., ge=1960, le=2025, example=1990)
    year: int = Field(default=2025, ge=2015, le=2035, example=2025)
    month: int = Field(default=1, ge=1, le=12, example=6)
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class PredictionResponse(BaseModel):
    success: bool
    predicted_price: Optional[float] = None
    formatted_price: Optional[str] = None
    base_price: Optional[float] = None
    trend_multiplier: Optional[float] = None
    coordinates: Optional[dict] = None
    distances: Optional[dict] = None
    remaining_lease: Optional[int] = None
    error: Optional[str] = None


class MultiYearPredictionRequest(BaseModel):
    block: str
    street: str
    town: str
    flat_type: str
    flat_model: str
    floor_area_sqm: float
    floor_level: int
    lease_commence_year: int
    month: int = 1
    years: List[int] = Field(default=[2025, 2026, 2027, 2028, 2029, 2030])
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class YearPrediction(BaseModel):
    year: int
    predicted_price: float
    formatted_price: str
    base_price: float
    trend_multiplier: float
    remaining_lease: int
    yoy_change: Optional[float] = None


class MultiYearPredictionResponse(BaseModel):
    success: bool
    predictions: Optional[List[YearPrediction]] = None
    coordinates: Optional[dict] = None
    distances: Optional[dict] = None
    error: Optional[str] = None


# ============================================
# ENDPOINTS
# ============================================

@app.get("/")
async def root():
    return {
        "message": "HDB Price Prediction & Recommendation API",
        "version": "3.1.0",
        "model": "XGBoost + Prophet Hybrid",
        "endpoints": {
            "/predict": "Single year prediction",
            "/predict/multi-year": "Multi-year trajectory (2025-2030)",
            "/recommend": "Get personalized flat recommendations",
            "/options/towns": "Get available towns",
            "/options/flat_types": "Get available flat types",
            "/options/flat_models": "Get available flat models",
            "/health": "Health check"
        }
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "trend_multipliers_loaded": trend_multipliers is not None,
        "mappings_loaded": mappings is not None,
        "amenities_loaded": amenity_data is not None
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict HDB resale price using hybrid model.
    
    Formula: Final Price = XGBoost_base × Prophet_trend
    """
    try:
        # Step 1: Validate coordinates
        if request.latitude is None or request.longitude is None:
            return PredictionResponse(
                success=False,
                error="Coordinates required. Please select an address from dropdown."
            )
        
        lat, lon = request.latitude, request.longitude
        coords = {'latitude': lat, 'longitude': lon, 'address': f"{request.block} {request.street}"}
        
        # Step 2: Calculate distances
        distances = calculate_all_distances(lat, lon)
        
        # Step 3: Get codes from mappings
        town = request.town.upper()
        flat_type = request.flat_type.upper()
        flat_model = request.flat_model
        
        # Town code
        town_df = mappings['town']
        town_row = town_df[town_df['town'] == town]
        if town_row.empty:
            return PredictionResponse(success=False, error=f"Unknown town: {town}")
        town_code = town_row['town_code'].values[0]
        
        # Flat type code
        flat_type_df = mappings['flat_type']
        flat_type_row = flat_type_df[flat_type_df['flat_type'] == flat_type]
        if flat_type_row.empty:
            return PredictionResponse(success=False, error=f"Unknown flat type: {flat_type}")
        flat_type_int = flat_type_row['flat_type_int'].values[0]
        
        # Flat model code
        flat_model_df = mappings['flat_model']
        flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'] == flat_model]
        if flat_model_row.empty:
            flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'].str.upper() == flat_model.upper()]
        if flat_model_row.empty:
            flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'] == 'OTHER']
            if flat_model_row.empty:
                flat_model_row = flat_model_df.iloc[[0]]
        flat_model_code = flat_model_row['flat_model_code'].values[0]
        
        # Region code
        region_code = TOWN_TO_REGION.get(town, 2)
        
        # Step 4: Calculate remaining_lease (HYBRID MODEL uses this instead of year)
        remaining_lease = 99 - (request.year - request.lease_commence_year)
        
        # Step 5: Build model input (16 features for HYBRID model)
        quarter = (request.month - 1) // 3 + 1
        
        model_input = pd.DataFrame([{
            'floor_area_sqm': request.floor_area_sqm,
            'lease_commence_year': request.lease_commence_year,
            'floor_level': request.floor_level,
            'distance_to_nearest_primary_school_km': distances['distance_to_nearest_primary_school_km'],
            'distance_to_nearest_high_value_school_km': distances['distance_to_nearest_high_value_school_km'],
            'distance_to_nearest_mrt_km': distances['distance_to_nearest_mrt_km'],
            'distance_to_nearest_hawker_km': distances['distance_to_nearest_hawker_km'],
            'distance_to_nearest_mall_km': distances['distance_to_nearest_mall_km'],
            'distance_to_cbd_km': distances['distance_to_cbd_km'],
            'month_num': request.month,
            'quarter': quarter,
            'region_code': region_code,
            'flat_type_int': flat_type_int,
            'flat_model_code': flat_model_code,
            'town_code': town_code,
            'remaining_lease': remaining_lease  # ← HYBRID: uses remaining_lease, NOT year
        }])
        
        # Step 6: Get base prediction from XGBoost
        base_price = float(model.predict(model_input)[0])
        
        # Step 7: Apply trend multiplier from Prophet
        trend = get_trend_multiplier(request.year)
        final_price = base_price * trend
        
        return PredictionResponse(
            success=True,
            predicted_price=round(final_price, 2),
            formatted_price=f"${final_price:,.0f}",
            base_price=round(base_price, 2),
            trend_multiplier=round(trend, 4),
            coordinates=coords,
            distances={k: round(v, 4) for k, v in distances.items()},
            remaining_lease=remaining_lease
        )
        
    except Exception as e:
        print(f"X Prediction error: {e}")
        import traceback
        traceback.print_exc()
        return PredictionResponse(success=False, error=f"Prediction failed: {str(e)}")


@app.post("/predict/multi-year", response_model=MultiYearPredictionResponse)
async def predict_multi_year(request: MultiYearPredictionRequest):
    """
    Predict HDB resale prices for multiple years (2025-2030).
    
    Shows how price changes over time due to:
    - Lease decay (XGBoost base decreases)
    - Market growth (Prophet trend increases)
    """
    try:
        # Validate coordinates
        if request.latitude is None or request.longitude is None:
            return MultiYearPredictionResponse(
                success=False,
                error="Coordinates required. Please select an address from dropdown."
            )
        
        lat, lon = request.latitude, request.longitude
        coords = {'latitude': lat, 'longitude': lon, 'address': f"{request.block} {request.street}"}
        
        # Calculate distances (once)
        distances = calculate_all_distances(lat, lon)
        
        # Get codes
        town = request.town.upper()
        flat_type = request.flat_type.upper()
        flat_model = request.flat_model
        
        town_df = mappings['town']
        town_row = town_df[town_df['town'] == town]
        if town_row.empty:
            return MultiYearPredictionResponse(success=False, error=f"Unknown town: {town}")
        town_code = town_row['town_code'].values[0]
        
        flat_type_df = mappings['flat_type']
        flat_type_row = flat_type_df[flat_type_df['flat_type'] == flat_type]
        if flat_type_row.empty:
            return MultiYearPredictionResponse(success=False, error=f"Unknown flat type: {flat_type}")
        flat_type_int = flat_type_row['flat_type_int'].values[0]
        
        flat_model_df = mappings['flat_model']
        flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'] == flat_model]
        if flat_model_row.empty:
            flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'].str.upper() == flat_model.upper()]
        if flat_model_row.empty:
            flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'] == 'OTHER']
            if flat_model_row.empty:
                flat_model_row = flat_model_df.iloc[[0]]
        flat_model_code = flat_model_row['flat_model_code'].values[0]
        
        region_code = TOWN_TO_REGION.get(town, 2)
        quarter = (request.month - 1) // 3 + 1
        
        # Predict for each year
        predictions = []
        prev_price = None
        
        for year in request.years:
            # Calculate remaining_lease for this year
            remaining_lease = 99 - (year - request.lease_commence_year)
            
            # Build model input
            model_input = pd.DataFrame([{
                'floor_area_sqm': request.floor_area_sqm,
                'lease_commence_year': request.lease_commence_year,
                'floor_level': request.floor_level,
                'distance_to_nearest_primary_school_km': distances['distance_to_nearest_primary_school_km'],
                'distance_to_nearest_high_value_school_km': distances['distance_to_nearest_high_value_school_km'],
                'distance_to_nearest_mrt_km': distances['distance_to_nearest_mrt_km'],
                'distance_to_nearest_hawker_km': distances['distance_to_nearest_hawker_km'],
                'distance_to_nearest_mall_km': distances['distance_to_nearest_mall_km'],
                'distance_to_cbd_km': distances['distance_to_cbd_km'],
                'month_num': request.month,
                'quarter': quarter,
                'region_code': region_code,
                'flat_type_int': flat_type_int,
                'flat_model_code': flat_model_code,
                'town_code': town_code,
                'remaining_lease': remaining_lease
            }])
            
            # Get base + trend
            base_price = float(model.predict(model_input)[0])
            trend = get_trend_multiplier(year)
            final_price = base_price * trend
            
            # Calculate YoY change
            yoy_change = None
            if prev_price:
                yoy_change = round((final_price - prev_price) / prev_price * 100, 2)
            prev_price = final_price
            
            predictions.append(YearPrediction(
                year=year,
                predicted_price=round(final_price, 2),
                formatted_price=f"${final_price:,.0f}",
                base_price=round(base_price, 2),
                trend_multiplier=round(trend, 4),
                remaining_lease=remaining_lease,
                yoy_change=yoy_change
            ))
        
        return MultiYearPredictionResponse(
            success=True,
            predictions=predictions,
            coordinates=coords,
            distances={k: round(v, 4) for k, v in distances.items()}
        )
        
    except Exception as e:
        print(f"X Multi-year prediction error: {e}")
        import traceback
        traceback.print_exc()
        return MultiYearPredictionResponse(success=False, error=f"Prediction failed: {str(e)}")


@app.get("/options/towns")
async def get_towns():
    """Get list of available towns"""
    if mappings:
        return {"towns": sorted(mappings['town']['town'].tolist())}
    return {"towns": []}


@app.get("/options/flat_types")
async def get_flat_types():
    """Get list of available flat types"""
    if mappings:
        return {"flat_types": mappings['flat_type']['flat_type'].tolist()}
    return {"flat_types": []}


@app.get("/options/flat_models")
async def get_flat_models():
    """Get list of available flat models"""
    if mappings:
        return {"flat_models": mappings['flat_model']['flat_model_grouped'].tolist()}
    return {"flat_models": []}


@app.get("/trend-multipliers")
async def get_trend_multipliers():
    """Get all trend multipliers (for debugging/display)"""
    return {"trend_multipliers": trend_multipliers}


# ============================================
# LOCATION DATA ENDPOINTS (for dropdowns)
# ============================================

@app.get("/locations/schools")
async def get_schools():
    """Get list of all primary schools with coordinates"""
    if location_data and location_data.get('schools'):
        schools = [
            {
                "name": s.get('school_name', s.get('name', '')),
                "lat": s.get('latitude', s.get('lat')),
                "lon": s.get('longitude', s.get('lon'))
            }
            for s in location_data['schools']
        ]
        return {"schools": sorted(schools, key=lambda x: x['name'])}
    return {"schools": []}


@app.get("/locations/poi-categories")
async def get_poi_categories():
    """Get list of available POI categories"""
    if location_data and location_data.get('poi_categories'):
        # Return user-friendly category names
        category_labels = {
            'supermarket': 'Supermarket',
            'shopping_mall': 'Shopping Mall',
            'gym': 'Gym / Fitness',
            'hospital': 'Hospital',
            'clinic': 'Clinic',
            'pharmacy': 'Pharmacy',
            'restaurant': 'Restaurant',
            'cafe': 'Cafe',
            'fast_food': 'Fast Food',
            'bank': 'Bank',
            'atm': 'ATM',
            'convenience_store': 'Convenience Store',
            'attraction': 'Attraction / Tourist Spot',
            'university': 'University',
            'college': 'College',
            'yoga': 'Yoga Studio',
            'co_working': 'Co-working Space',
            'hotel': 'Hotel',
            'bakery': 'Bakery',
            'bookstore': 'Bookstore',
            'clothing_store': 'Clothing Store',
            'electronics_store': 'Electronics Store',
            'jewelry_store': 'Jewelry Store',
            'department_store': 'Department Store',
            'dentist': 'Dentist',
            'charging_station': 'EV Charging Station',
            'viewpoint': 'Viewpoint / Scenic Spot',
            'hostel': 'Hostel',
            'school': 'School'
        }
        categories = [
            {
                "value": cat,
                "label": category_labels.get(cat, cat.replace('_', ' ').title()),
                "count": len(location_data['pois'].get(cat, []))
            }
            for cat in location_data['poi_categories']
        ]
        return {"categories": sorted(categories, key=lambda x: x['label'])}
    return {"categories": []}


@app.get("/locations/pois/{category}")
async def get_pois_by_category(category: str):
    """Get list of POIs for a specific category"""
    if location_data and location_data.get('pois'):
        pois = location_data['pois'].get(category, [])
        return {
            "category": category,
            "pois": sorted(pois, key=lambda x: x.get('name', ''))
        }
    return {"category": category, "pois": []}


@app.get("/locations/work-areas")
async def get_work_areas():
    """Get list of common work areas/business districts"""
    work_areas = [
        {"name": "CBD (Raffles Place)", "lat": 1.2840, "lon": 103.8515},
        {"name": "Marina Bay", "lat": 1.2789, "lon": 103.8536},
        {"name": "Shenton Way", "lat": 1.2760, "lon": 103.8460},
        {"name": "Tanjong Pagar", "lat": 1.2764, "lon": 103.8466},
        {"name": "Orchard Road", "lat": 1.3050, "lon": 103.8320},
        {"name": "Jurong East", "lat": 1.3329, "lon": 103.7436},
        {"name": "Jurong Island", "lat": 1.2660, "lon": 103.6990},
        {"name": "Changi Business Park", "lat": 1.3345, "lon": 103.9650},
        {"name": "Paya Lebar", "lat": 1.3180, "lon": 103.8930},
        {"name": "Woodlands", "lat": 1.4360, "lon": 103.7865},
        {"name": "Tampines", "lat": 1.3534, "lon": 103.9450},
        {"name": "One North", "lat": 1.2990, "lon": 103.7873},
        {"name": "Buona Vista", "lat": 1.3070, "lon": 103.7900},
        {"name": "Novena", "lat": 1.3204, "lon": 103.8438},
        {"name": "Tuas", "lat": 1.3150, "lon": 103.6360},
        {"name": "Mapletree Business City", "lat": 1.3027, "lon": 103.7895},
        {"name": "Science Park", "lat": 1.2960, "lon": 103.7870},
        {"name": "Alexandra", "lat": 1.2880, "lon": 103.8020},
        {"name": "Harbourfront", "lat": 1.2655, "lon": 103.8200},
        {"name": "Suntec City", "lat": 1.2940, "lon": 103.8570},
        {"name": "Bugis", "lat": 1.3005, "lon": 103.8550},
        {"name": "City Hall", "lat": 1.2930, "lon": 103.8520},
        {"name": "Dhoby Ghaut", "lat": 1.2990, "lon": 103.8460},
        {"name": "Outram", "lat": 1.2800, "lon": 103.8390}
    ]
    return {"work_areas": sorted(work_areas, key=lambda x: x['name'])}


# ============================================
# RECOMMENDATION MODELS
# ============================================

class WorkLocation(BaseModel):
    person: str = "You"
    location: str = ""
    frequency: str = "Daily (5x per week)"

class SchoolLocation(BaseModel):
    child: str = "Child 1"
    school: str = ""

class ParentHome(BaseModel):
    parent: str = "Parent 1"
    location: str = ""
    frequency: str = "Weekly (1x per week)"

class OtherDestination(BaseModel):
    name: str = ""
    location: str = ""
    category: str = "Other"
    frequency: str = "Weekly (1x per week)"

class MaxDistances(BaseModel):
    mrt: Optional[float] = None
    school: Optional[float] = None
    mall: Optional[float] = None
    hawker: Optional[float] = None

class Destinations(BaseModel):
    workLocations: List[WorkLocation] = []
    schoolLocations: List[SchoolLocation] = []
    parentsHomes: List[ParentHome] = []
    otherDestinations: List[OtherDestination] = []

class RecommendationRequest(BaseModel):
    """Request model matching the React frontend format."""
    targetYear: int = Field(default=2026, ge=2025, le=2030)
    budget: List[float] = Field(default=[400000, 700000])
    towns: List[str] = []
    flatTypes: List[str] = []
    flatModels: List[str] = []
    floorArea: List[float] = Field(default=[70, 120])
    storeyRanges: List[str] = []
    leaseRange: List[float] = Field(default=[30, 65])
    maxDistances: MaxDistances = MaxDistances()
    destinations: Destinations = Destinations()

class RecommendationResponse(BaseModel):
    success: bool
    total_candidates: int = 0
    recommendations: List[Dict[str, Any]] = []
    message: Optional[str] = None
    error: Optional[str] = None


# ============================================
# RECOMMENDATION HELPER
# ============================================

def predict_price_for_recommendation(
    town: str,
    flat_type: str,
    flat_model: str,
    floor_area_sqm: float,
    floor_level: int,
    lease_commence_year: int,
    year: int,
    lat: float,
    lon: float,
    distances: dict
) -> float:
    """
    Predict price using hybrid model for recommendation scoring.
    This wraps the existing prediction logic for use in recommendations.
    """
    # Get codes from mappings
    town_df = mappings['town']
    town_row = town_df[town_df['town'] == town.upper()]
    if town_row.empty:
        raise ValueError(f"Unknown town: {town}")
    town_code = town_row['town_code'].values[0]
    
    flat_type_df = mappings['flat_type']
    flat_type_row = flat_type_df[flat_type_df['flat_type'] == flat_type.upper()]
    if flat_type_row.empty:
        raise ValueError(f"Unknown flat type: {flat_type}")
    flat_type_int = flat_type_row['flat_type_int'].values[0]
    
    flat_model_df = mappings['flat_model']
    flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'] == flat_model]
    if flat_model_row.empty:
        flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'].str.upper() == flat_model.upper()]
    if flat_model_row.empty:
        flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'] == 'OTHER']
        if flat_model_row.empty:
            flat_model_row = flat_model_df.iloc[[0]]
    flat_model_code = flat_model_row['flat_model_code'].values[0]
    
    region_code = TOWN_TO_REGION.get(town.upper(), 2)
    remaining_lease = 99 - (year - lease_commence_year)
    quarter = 1  # Default to Q1
    month = 1
    
    # Build model input
    model_input = pd.DataFrame([{
        'floor_area_sqm': floor_area_sqm,
        'lease_commence_year': lease_commence_year,
        'floor_level': floor_level,
        'distance_to_nearest_primary_school_km': distances.get('distance_to_nearest_primary_school_km', 0.5),
        'distance_to_nearest_high_value_school_km': distances.get('distance_to_nearest_high_value_school_km', 1.0),
        'distance_to_nearest_mrt_km': distances.get('distance_to_nearest_mrt_km', 0.5),
        'distance_to_nearest_hawker_km': distances.get('distance_to_nearest_hawker_km', 0.5),
        'distance_to_nearest_mall_km': distances.get('distance_to_nearest_mall_km', 1.0),
        'distance_to_cbd_km': distances.get('distance_to_cbd_km', 10.0),
        'month_num': month,
        'quarter': quarter,
        'region_code': region_code,
        'flat_type_int': flat_type_int,
        'flat_model_code': flat_model_code,
        'town_code': town_code,
        'remaining_lease': remaining_lease
    }])
    
    # Get base prediction
    base_price = float(model.predict(model_input)[0])
    
    # Apply trend multiplier
    trend = get_trend_multiplier(year)
    final_price = base_price * trend
    
    return final_price


# ============================================
# RECOMMENDATION ENDPOINT
# ============================================

# Simple cache for recommendations (LRU with max entries)
_recommendation_cache = {}
_cache_max_size = 500  # Increased for more concurrent users

def _get_cache_key(user_input: dict) -> str:
    """Generate a cache key from user input."""
    # Create a hashable representation
    key_parts = [
        str(user_input.get('targetYear')),
        str(user_input.get('budget')),
        str(sorted(user_input.get('towns', []))),
        str(sorted(user_input.get('flatTypes', []))),
        str(user_input.get('floorArea')),
        str(user_input.get('leaseRange')),
    ]
    key_str = '|'.join(key_parts)
    return hashlib.md5(key_str.encode()).hexdigest()

def _run_recommendations(user_input: dict) -> dict:
    """CPU-bound recommendation task - runs in thread pool."""
    return generate_recommendations(
        user_input=user_input,
        calculate_distances_fn=calculate_all_distances,
        predict_price_fn=predict_price_for_recommendation,
        mappings=mappings,
        location_data=location_data,
        hdb_data=hdb_data,
        top_n=10
    )

@app.post("/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get personalized HDB flat recommendations.
    
    Uses 5-score weighted ranking:
    - Travel Convenience (35%): Distance to work/school/parents
    - Value Efficiency (25%): Price per sqm vs similar flats
    - Budget Comfort (20%): How well price fits budget
    - Amenity Access (15%): Proximity to MRT, schools, malls
    - Space Adequacy (5%): Floor area vs preference
    
    Supports concurrent requests via thread pool executor.
    """
    try:
        # Convert request to dict for recommendation engine
        user_input = {
            'targetYear': request.targetYear,
            'budget': request.budget,
            'towns': [t.upper() for t in request.towns],
            'flatTypes': [ft.upper() for ft in request.flatTypes],
            'flatModels': request.flatModels,
            'floorArea': request.floorArea,
            'storeyRanges': request.storeyRanges,
            'leaseRange': request.leaseRange,
            'maxDistances': {
                'mrt': request.maxDistances.mrt,
                'school': request.maxDistances.school,
                'mall': request.maxDistances.mall,
                'hawker': request.maxDistances.hawker
            },
            'workLocations': [w.dict() for w in request.destinations.workLocations],
            'schoolLocations': [s.dict() for s in request.destinations.schoolLocations],
            'parentsHomes': [p.dict() for p in request.destinations.parentsHomes],
            'otherDestinations': [o.dict() for o in request.destinations.otherDestinations]
        }
        
        print(f"\n{'='*60}")
        print(f"RECOMMENDATION REQUEST")
        print(f"{'='*60}")
        print(f"Target Year: {request.targetYear}")
        print(f"Budget: ${request.budget[0]:,.0f} - ${request.budget[1]:,.0f}")
        print(f"Towns: {request.towns if request.towns else 'Any'}")
        print(f"Flat Types: {request.flatTypes if request.flatTypes else 'Any'}")
        print(f"Destinations: {len(user_input['workLocations'])} work, {len(user_input['parentsHomes'])} parents")
        
        # Check cache first
        cache_key = _get_cache_key(user_input)
        if cache_key in _recommendation_cache:
            print(f"[OK] Cache hit! Returning cached results")
            result = _recommendation_cache[cache_key]
        else:
            # Run CPU-bound task in thread pool (non-blocking for other requests)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(executor, _run_recommendations, user_input)
            
            # Cache the result (with size limit)
            if len(_recommendation_cache) >= _cache_max_size:
                # Remove oldest entry
                oldest_key = next(iter(_recommendation_cache))
                del _recommendation_cache[oldest_key]
            _recommendation_cache[cache_key] = result
        
        print(f"[OK] Found {result['total_candidates']} candidates")
        print(f"[OK] Returning top {len(result['recommendations'])} recommendations")
        print(f"{'='*60}\n")
        
        return RecommendationResponse(
            success=True,
            total_candidates=result['total_candidates'],
            recommendations=result['recommendations'],
            message=result.get('message')
        )
        
    except Exception as e:
        print(f"X Recommendation error: {e}")
        import traceback
        traceback.print_exc()
        return RecommendationResponse(
            success=False,
            error=f"Recommendation failed: {str(e)}"
        )


@app.post("/recommend/clear-cache")
async def clear_recommendation_cache():
    """Clear the recommendation cache."""
    global _recommendation_cache
    count = len(_recommendation_cache)
    _recommendation_cache = {}
    return {"success": True, "message": f"Cleared {count} cached entries"}


@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers."""
    return {
        "status": "healthy",
        "cpu_cores": CPU_CORES,
        "thread_workers": THREAD_WORKERS,
        "cache_size": len(_recommendation_cache),
        "cache_max": _cache_max_size
    }


# ============================================
# RUN SERVER
# ============================================

if __name__ == "__main__":
    import uvicorn
    # Development (single worker):
    #   uvicorn app.main:app --reload --port 8000
    #
    # Production (multiple workers for 10+ users):
    #   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    #
    # High load (20+ users) with Gunicorn:
    #   gunicorn app.main:app -w 8 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
    #
    uvicorn.run(app, host="0.0.0.0", port=8000)