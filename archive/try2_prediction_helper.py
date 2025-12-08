"""
Try 2: HDB Price Prediction with Geocoding
==========================================
Uses OneMap API to get actual coordinates from block + street,
then calculates real distances to amenities.

Accuracy: Block-level (matches training data)
"""

import pandas as pd
import numpy as np
import requests
import joblib
from sklearn.neighbors import BallTree

# ============================================
# GEOCODING - OneMap API
# ============================================

def get_coordinates(block: str, street: str) -> dict:
    """
    Get lat/lng from Singapore address using OneMap API.
    
    Args:
        block: Block number (e.g., "123")
        street: Street name (e.g., "Bedok North Road")
        
    Returns:
        dict with latitude, longitude, full_address or None if not found
    """
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


# ============================================
# DISTANCE CALCULATION
# ============================================

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Calculate Haversine distance between two points in km"""
    R = 6371  # Earth radius in km
    
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a))
    
    return R * c


def get_nearest_distance(lat, lon, amenity_coords):
    """
    Get distance to nearest amenity using BallTree.
    
    Args:
        lat, lon: HDB coordinates
        amenity_coords: numpy array of [lat, lon] for amenities
        
    Returns:
        Distance in km to nearest amenity
    """
    # Convert to radians
    hdb_radians = np.radians([[lat, lon]])
    amenity_radians = np.radians(amenity_coords)
    
    # Build tree and query
    tree = BallTree(amenity_radians, metric='haversine')
    distance, _ = tree.query(hdb_radians, k=1)
    
    # Convert to km
    return distance[0][0] * 6371


class DistanceCalculator:
    """
    Calculates distances from HDB to various amenities.
    Load amenity datasets once, reuse for multiple predictions.
    """
    
    def __init__(self, data_path='03_dataset_for_ML_model'):
        """Load all amenity datasets"""
        print("Loading amenity datasets...")
        
        # Load amenity coordinates
        self.primary_schools = pd.read_csv(f'{data_path}/Primary_school_dataset.csv')[['latitude', 'longitude']].values
        self.high_value_schools = pd.read_csv(f'{data_path}/Ballot_school.csv')[['latitude', 'longitude']].values
        self.mrt_stations = pd.read_csv(f'{data_path}/MRT_datasets.csv')[['latitude', 'longitude']].values
        self.hawker_centers = pd.read_csv(f'{data_path}/Hawker_Centers_datasets.csv')[['latitude', 'longitude']].values
        self.malls = pd.read_csv(f'{data_path}/Malls_datasets.csv')[['latitude', 'longitude']].values
        self.cbd = pd.read_csv(f'{data_path}/singapore_business_district.csv')[['latitude', 'longitude']].values
        
        print(f"✓ Loaded: {len(self.primary_schools)} schools, {len(self.mrt_stations)} MRTs, "
              f"{len(self.hawker_centers)} hawkers, {len(self.malls)} malls")
    
    def calculate_all_distances(self, lat: float, lon: float) -> dict:
        """
        Calculate distances from given coordinates to all amenity types.
        
        Returns:
            dict with all 6 distance features
        """
        return {
            'distance_to_nearest_primary_school_km': get_nearest_distance(lat, lon, self.primary_schools),
            'distance_to_nearest_high_value_school_km': get_nearest_distance(lat, lon, self.high_value_schools),
            'distance_to_nearest_mrt_km': get_nearest_distance(lat, lon, self.mrt_stations),
            'distance_to_nearest_hawker_km': get_nearest_distance(lat, lon, self.hawker_centers),
            'distance_to_nearest_mall_km': get_nearest_distance(lat, lon, self.malls),
            'distance_to_cbd_km': get_nearest_distance(lat, lon, self.cbd)
        }


# ============================================
# MAPPINGS
# ============================================

def load_mappings(mapping_path='Model_Building/mappings_csv'):
    """Load all mapping CSVs"""
    return {
        'town': pd.read_csv(f'{mapping_path}/town_code_map.csv'),
        'flat_type': pd.read_csv(f'{mapping_path}/flat_type_int_map.csv'),
        'flat_model': pd.read_csv(f'{mapping_path}/flat_model_code_map.csv'),
        'region': pd.read_csv(f'{mapping_path}/region_code_map.csv'),
    }

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
# MAIN PREDICTION FUNCTION
# ============================================

def prepare_prediction_input(user_input: dict, distances: dict, mappings: dict) -> pd.DataFrame:
    """
    Convert UI inputs + calculated distances to model-ready DataFrame.
    
    Args:
        user_input: dict from UI
        distances: dict with 6 distance values (from DistanceCalculator)
        mappings: loaded mapping DataFrames
        
    Returns:
        pd.DataFrame ready for model.predict()
    """
    town = user_input['town'].upper()
    flat_type = user_input['flat_type'].upper()
    flat_model = user_input['flat_model']
    
    # Get codes from mappings
    town_code = mappings['town'][mappings['town']['town'] == town]['town_code'].values[0]
    flat_type_int = mappings['flat_type'][mappings['flat_type']['flat_type'] == flat_type]['flat_type_int'].values[0]
    flat_model_code = mappings['flat_model'][mappings['flat_model']['flat_model_grouped'] == flat_model]['flat_model_code'].values[0]
    region_code = TOWN_TO_REGION.get(town, 2)
    
    # Time features
    year = user_input['year']
    month = user_input['month']
    quarter = (month - 1) // 3 + 1
    
    # Build model input
    model_input = pd.DataFrame([{
        'floor_area_sqm': user_input['floor_area_sqm'],
        'lease_commence_year': user_input['lease_commence_year'],
        'floor_level': user_input['floor_level'],
        'distance_to_nearest_primary_school_km': distances['distance_to_nearest_primary_school_km'],
        'distance_to_nearest_high_value_school_km': distances['distance_to_nearest_high_value_school_km'],
        'distance_to_nearest_mrt_km': distances['distance_to_nearest_mrt_km'],
        'distance_to_nearest_hawker_km': distances['distance_to_nearest_hawker_km'],
        'distance_to_nearest_mall_km': distances['distance_to_nearest_mall_km'],
        'distance_to_cbd_km': distances['distance_to_cbd_km'],
        'year': year,
        'month_num': month,
        'quarter': quarter,
        'region_code': region_code,
        'flat_type_int': flat_type_int,
        'flat_model_code': flat_model_code,
        'town_code': town_code
    }])
    
    return model_input


def predict_price_try2(user_input: dict, model, mappings: dict, distance_calculator: DistanceCalculator) -> dict:
    """
    Complete Try 2 prediction pipeline:
    UI input → Geocode → Calculate distances → Predict
    
    Args:
        user_input: dict with block, street, town, flat_type, etc.
        model: loaded XGBoost model
        mappings: loaded mapping DataFrames
        distance_calculator: DistanceCalculator instance
        
    Returns:
        dict with prediction results
    """
    # Step 1: Geocode address
    coords = get_coordinates(user_input['block'], user_input['street'])
    
    if coords is None:
        return {
            'success': False,
            'error': f"Could not find address: {user_input['block']} {user_input['street']}"
        }
    
    # Step 2: Calculate distances
    distances = distance_calculator.calculate_all_distances(coords['latitude'], coords['longitude'])
    
    # Step 3: Prepare model input
    model_input = prepare_prediction_input(user_input, distances, mappings)
    
    # Step 4: Predict
    predicted_price = model.predict(model_input)[0]
    
    return {
        'success': True,
        'predicted_price': round(predicted_price, 2),
        'formatted_price': f"${predicted_price:,.2f}",
        'coordinates': coords,
        'distances': {k: round(v, 4) for k, v in distances.items()},
        'model_input': model_input.to_dict(orient='records')[0]
    }


# ============================================
# EXAMPLE USAGE
# ============================================

if __name__ == "__main__":
    print("="*60)
    print("Try 2: Geocoding-based HDB Price Prediction")
    print("="*60)
    
    # Load resources
    print("\n[1] Loading resources...")
    mappings = load_mappings()
    distance_calc = DistanceCalculator()
    model = joblib.load('Model_Building/xgb_resale_all.joblib')
    print("✓ All resources loaded!")
    
    # Example user input
    user_input = {
        'block': '123',
        'street': 'Bedok North Road',
        'town': 'BEDOK',
        'flat_type': '4 ROOM',
        'flat_model': 'Model A',
        'floor_area_sqm': 90.0,
        'lease_commence_year': 2010,
        'floor_level': 12,
        'year': 2025,
        'month': 6
    }
    
    print(f"\n[2] User Input:")
    print(f"    Address: {user_input['block']} {user_input['street']}")
    print(f"    Town: {user_input['town']}, Flat: {user_input['flat_type']}, Model: {user_input['flat_model']}")
    print(f"    Area: {user_input['floor_area_sqm']} sqm, Floor: {user_input['floor_level']}")
    
    # Get prediction
    print("\n[3] Processing...")
    result = predict_price_try2(user_input, model, mappings, distance_calc)
    
    if result['success']:
        print(f"\n[4] Results:")
        print(f"    📍 Coordinates: ({result['coordinates']['latitude']:.6f}, {result['coordinates']['longitude']:.6f})")
        print(f"    📍 Address: {result['coordinates']['full_address']}")
        print(f"\n    📏 Calculated Distances:")
        for key, val in result['distances'].items():
            print(f"       {key}: {val:.4f} km")
        print(f"\n    💰 PREDICTED PRICE: {result['formatted_price']}")
    else:
        print(f"\n❌ Error: {result['error']}")
