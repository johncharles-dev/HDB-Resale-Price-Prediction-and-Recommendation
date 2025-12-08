"""
Try 2: FastAPI Backend with Geocoding
=====================================
- Accepts coordinates directly from frontend (when UI does geocoding)
- Falls back to OneMap geocoding if coordinates not provided

Run: uvicorn try2_api_server:app --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import joblib
import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree
import requests

# ============================================
# Initialize FastAPI
# ============================================

app = FastAPI(
    title="HDB Price Prediction API - Try 2",
    description="Geocoding-based prediction with actual block-level distances",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Global Resources
# ============================================

model = None
mappings = None
amenity_data = None

# Town to Region mapping
TOWN_TO_REGION = {
    'BUKIT TIMAH': 0, 'CENTRAL AREA': 0, 'MARINE PARADE': 0,  # CCR
    'BISHAN': 1, 'BUKIT MERAH': 1, 'GEYLANG': 1, 'KALLANG/WHAMPOA': 1,
    'QUEENSTOWN': 1, 'TOA PAYOH': 1, 'SERANGOON': 1,  # RCR
    'ANG MO KIO': 2, 'BEDOK': 2, 'BUKIT BATOK': 2, 'BUKIT PANJANG': 2,
    'CHOA CHU KANG': 2, 'CLEMENTI': 2, 'HOUGANG': 2, 'JURONG EAST': 2,
    'JURONG WEST': 2, 'PASIR RIS': 2, 'PUNGGOL': 2, 'SEMBAWANG': 2,
    'SENGKANG': 2, 'TAMPINES': 2, 'WOODLANDS': 2, 'YISHUN': 2,  # OCR
}


# ============================================
# Helper Functions
# ============================================

def get_nearest_distance(lat, lon, amenity_coords):
    """Calculate distance to nearest amenity using BallTree"""
    hdb_radians = np.radians([[lat, lon]])
    amenity_radians = np.radians(amenity_coords)
    tree = BallTree(amenity_radians, metric='haversine')
    distance, _ = tree.query(hdb_radians, k=1)
    return distance[0][0] * 6371  # Convert to km


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


def get_coordinates_from_onemap(block: str, street: str) -> dict:
    """Geocode address using OneMap API"""
    address = f"{block} {street}"
    url = "https://www.onemap.gov.sg/api/common/elastic/search"
    
    params = {
        "searchVal": address,
        "returnGeom": "Y",
        "getAddrDetails": "Y"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data['found'] > 0:
            result = data['results'][0]
            return {
                'latitude': float(result['LATITUDE']),
                'longitude': float(result['LONGITUDE']),
                'full_address': result['ADDRESS']
            }
    except Exception as e:
        print(f"Geocoding error: {e}")
    
    return None


def load_mappings(mapping_path='Model_Building/mappings_csv'):
    """Load all mapping CSVs"""
    return {
        'town': pd.read_csv(f'{mapping_path}/town_code_map.csv'),
        'flat_type': pd.read_csv(f'{mapping_path}/flat_type_int_map.csv'),
        'flat_model': pd.read_csv(f'{mapping_path}/flat_model_code_map.csv'),
        'region': pd.read_csv(f'{mapping_path}/region_code_map.csv'),
    }


def load_amenity_data(data_path='03_dataset_for_ML_model'):
    """Load all amenity datasets"""
    return {
        'primary_schools': pd.read_csv(f'{data_path}/Primary_school_dataset.csv')[['latitude', 'longitude']].values,
        'high_value_schools': pd.read_csv(f'{data_path}/Ballot_school.csv')[['latitude', 'longitude']].values,
        'mrt_stations': pd.read_csv(f'{data_path}/MRT_datasets.csv')[['latitude', 'longitude']].values,
        'hawker_centers': pd.read_csv(f'{data_path}/Hawker_Centers_datasets.csv')[['latitude', 'longitude']].values,
        'malls': pd.read_csv(f'{data_path}/Malls_datasets.csv')[['latitude', 'longitude']].values,
        'cbd': pd.read_csv(f'{data_path}/singapore_business_district.csv')[['latitude', 'longitude']].values,
    }


# ============================================
# Startup
# ============================================

@app.on_event("startup")
async def load_resources():
    global model, mappings, amenity_data
    print("Loading model, mappings, and amenity data...")
    model = joblib.load('Model_Building/xgb_resale_all.joblib')
    mappings = load_mappings()
    amenity_data = load_amenity_data()
    print("✓ All resources loaded!")


# ============================================
# Request/Response Models
# ============================================

class PredictionRequest(BaseModel):
    block: str
    street: str
    town: str
    flat_type: str
    flat_model: str
    floor_area_sqm: float
    lease_commence_year: int
    floor_level: int
    year: Optional[int] = 2025
    month: Optional[int] = 6
    # Optional: Frontend can pass coordinates directly
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "block": "112A",
                "street": "Depot Road",
                "town": "BUKIT MERAH",
                "flat_type": "4 ROOM",
                "flat_model": "Model A",
                "floor_area_sqm": 100.0,
                "lease_commence_year": 2006,
                "floor_level": 11,
                "year": 2025,
                "month": 6,
                "latitude": 1.2815,
                "longitude": 103.8081
            }
        }


class PredictionResponse(BaseModel):
    success: bool
    predicted_price: Optional[float] = None
    formatted_price: Optional[str] = None
    coordinates: Optional[dict] = None
    distances: Optional[dict] = None
    error: Optional[str] = None


# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    return {
        "message": "HDB Price Prediction API - Try 2 (Geocoding)",
        "version": "2.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "amenity_data_loaded": amenity_data is not None
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """
    Predict HDB resale price.
    
    - If latitude/longitude provided: use directly (faster)
    - If not provided: geocode using OneMap API
    """
    try:
        # Step 1: Get coordinates
        if request.latitude and request.longitude:
            # Use coordinates from frontend
            lat = request.latitude
            lon = request.longitude
            coords = {
                'latitude': lat,
                'longitude': lon,
                'full_address': f"{request.block} {request.street}"
            }
        else:
            # Geocode using OneMap
            coords = get_coordinates_from_onemap(request.block, request.street)
            if not coords:
                return PredictionResponse(
                    success=False,
                    error=f"Could not find address: {request.block} {request.street}"
                )
            lat = coords['latitude']
            lon = coords['longitude']
        
        # Step 2: Calculate distances
        distances = calculate_all_distances(lat, lon)
        
        # Step 3: Get codes from mappings
        town = request.town.upper()
        flat_type = request.flat_type.upper()
        flat_model = request.flat_model
        
        town_df = mappings['town']
        town_row = town_df[town_df['town'] == town]
        if town_row.empty:
            return PredictionResponse(success=False, error=f"Unknown town: {town}")
        town_code = town_row['town_code'].values[0]
        
        flat_type_df = mappings['flat_type']
        flat_type_row = flat_type_df[flat_type_df['flat_type'] == flat_type]
        if flat_type_row.empty:
            return PredictionResponse(success=False, error=f"Unknown flat type: {flat_type}")
        flat_type_int = flat_type_row['flat_type_int'].values[0]
        
        flat_model_df = mappings['flat_model']
        flat_model_row = flat_model_df[flat_model_df['flat_model_grouped'] == flat_model]
        if flat_model_row.empty:
            return PredictionResponse(success=False, error=f"Unknown flat model: {flat_model}")
        flat_model_code = flat_model_row['flat_model_code'].values[0]
        
        region_code = TOWN_TO_REGION.get(town, 2)
        
        # Step 4: Build model input
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
            'year': request.year,
            'month_num': request.month,
            'quarter': quarter,
            'region_code': region_code,
            'flat_type_int': flat_type_int,
            'flat_model_code': flat_model_code,
            'town_code': town_code
        }])
        
        # Step 5: Predict
        predicted_price = model.predict(model_input)[0]
        
        return PredictionResponse(
            success=True,
            predicted_price=round(predicted_price, 2),
            formatted_price=f"${predicted_price:,.2f}",
            coordinates=coords,
            distances={k: round(v, 4) for k, v in distances.items()}
        )
        
    except Exception as e:
        return PredictionResponse(
            success=False,
            error=f"Prediction failed: {str(e)}"
        )


@app.get("/options/towns")
async def get_towns():
    """Get list of available towns"""
    return {"towns": sorted(mappings['town']['town'].tolist())}


@app.get("/options/flat_types")
async def get_flat_types():
    """Get list of available flat types"""
    return {"flat_types": mappings['flat_type']['flat_type'].tolist()}


@app.get("/options/flat_models")
async def get_flat_models():
    """Get list of available flat models"""
    return {"flat_models": mappings['flat_model']['flat_model_grouped'].tolist()}


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
