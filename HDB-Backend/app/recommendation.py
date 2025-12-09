"""
HDB Recommendation Service
Integrates with existing hybrid prediction model for recommendations.

Scoring Components:
1. Travel Convenience (35%) - Weighted distance to frequent destinations
2. Value Efficiency (25%)   - Price per sqm relative to candidates
3. Budget Comfort (20%)     - How comfortably price fits budget
4. Amenity Access (15%)     - Proximity to MRT, schools, malls, hawkers  
5. Space Adequacy (5%)      - Alignment with desired floor area
"""
import numpy as np
import pandas as pd
from math import radians, cos, sin, asin, sqrt
from typing import List, Dict, Optional, Tuple, Any, Callable
from dataclasses import dataclass
import random

# ============================================================================
# CONFIGURATION
# ============================================================================

SCORE_WEIGHTS = {
    'travel': 0.35,
    'value': 0.25,
    'budget': 0.20,
    'amenity': 0.15,
    'space': 0.05
}

FREQUENCY_WEIGHTS = {
    'Daily (5x per week)': 5.0,
    'daily': 5.0,
    '3-4x per week': 3.5,
    '2-3x per week': 2.5,
    '2-3_per_week': 2.5,
    '1-2x per week': 1.5,
    'Weekly (1x per week)': 1.0,
    'weekly': 1.0,
    '2-3x per month': 0.5,
    'Monthly (1x per month)': 0.25,
    '1-2_per_month': 0.25,
    'Rarely': 0.05,
    'rarely': 0.05
}

AMENITY_WEIGHTS = {
    'mrt': 0.40,
    'school': 0.30,
    'mall': 0.20,
    'hawker': 0.10
}

MAX_TRAVEL_DISTANCE_KM = 20.0

# Work location coordinates
WORK_LOCATION_COORDS = {
    "CBD (Raffles Place)": (1.2840, 103.8515),
    "Marina Bay": (1.2789, 103.8536),
    "Shenton Way": (1.2760, 103.8460),
    "Tanjong Pagar": (1.2764, 103.8466),
    "Jurong East": (1.3329, 103.7436),
    "Jurong Island": (1.2660, 103.6990),
    "Changi Business Park": (1.3345, 103.9650),
    "Paya Lebar": (1.3180, 103.8930),
    "Woodlands": (1.4360, 103.7865),
    "Tampines": (1.3534, 103.9450),
    "One North": (1.2990, 103.7873),
    "Buona Vista": (1.3070, 103.7900),
    "Novena": (1.3204, 103.8438)
}

# Town center coordinates and typical property characteristics
TOWN_DATA = {
    "ANG MO KIO": {"lat": 1.3691, "lon": 103.8454, "avg_price_4rm": 520000, "avg_lease": 1985},
    "BEDOK": {"lat": 1.3236, "lon": 103.9273, "avg_price_4rm": 480000, "avg_lease": 1988},
    "BISHAN": {"lat": 1.3526, "lon": 103.8352, "avg_price_4rm": 680000, "avg_lease": 1990},
    "BUKIT BATOK": {"lat": 1.3590, "lon": 103.7637, "avg_price_4rm": 450000, "avg_lease": 1988},
    "BUKIT MERAH": {"lat": 1.2819, "lon": 103.8239, "avg_price_4rm": 580000, "avg_lease": 1980},
    "BUKIT PANJANG": {"lat": 1.3774, "lon": 103.7719, "avg_price_4rm": 480000, "avg_lease": 1995},
    "BUKIT TIMAH": {"lat": 1.3294, "lon": 103.8021, "avg_price_4rm": 750000, "avg_lease": 1985},
    "CENTRAL AREA": {"lat": 1.2905, "lon": 103.8520, "avg_price_4rm": 850000, "avg_lease": 1985},
    "CHOA CHU KANG": {"lat": 1.3840, "lon": 103.7470, "avg_price_4rm": 450000, "avg_lease": 1998},
    "CLEMENTI": {"lat": 1.3162, "lon": 103.7649, "avg_price_4rm": 580000, "avg_lease": 1985},
    "GEYLANG": {"lat": 1.3201, "lon": 103.8918, "avg_price_4rm": 520000, "avg_lease": 1980},
    "HOUGANG": {"lat": 1.3612, "lon": 103.8863, "avg_price_4rm": 480000, "avg_lease": 1992},
    "JURONG EAST": {"lat": 1.3329, "lon": 103.7436, "avg_price_4rm": 480000, "avg_lease": 1988},
    "JURONG WEST": {"lat": 1.3404, "lon": 103.7090, "avg_price_4rm": 420000, "avg_lease": 1992},
    "KALLANG/WHAMPOA": {"lat": 1.3100, "lon": 103.8651, "avg_price_4rm": 620000, "avg_lease": 1978},
    "MARINE PARADE": {"lat": 1.3020, "lon": 103.9072, "avg_price_4rm": 720000, "avg_lease": 1980},
    "PASIR RIS": {"lat": 1.3721, "lon": 103.9494, "avg_price_4rm": 520000, "avg_lease": 1992},
    "PUNGGOL": {"lat": 1.3984, "lon": 103.9072, "avg_price_4rm": 550000, "avg_lease": 2012},
    "QUEENSTOWN": {"lat": 1.2942, "lon": 103.7861, "avg_price_4rm": 680000, "avg_lease": 1975},
    "SEMBAWANG": {"lat": 1.4491, "lon": 103.8185, "avg_price_4rm": 450000, "avg_lease": 2002},
    "SENGKANG": {"lat": 1.3868, "lon": 103.8914, "avg_price_4rm": 520000, "avg_lease": 2005},
    "SERANGOON": {"lat": 1.3554, "lon": 103.8679, "avg_price_4rm": 580000, "avg_lease": 1988},
    "TAMPINES": {"lat": 1.3534, "lon": 103.9450, "avg_price_4rm": 520000, "avg_lease": 1988},
    "TOA PAYOH": {"lat": 1.3343, "lon": 103.8563, "avg_price_4rm": 620000, "avg_lease": 1975},
    "WOODLANDS": {"lat": 1.4360, "lon": 103.7865, "avg_price_4rm": 420000, "avg_lease": 1998},
    "YISHUN": {"lat": 1.4304, "lon": 103.8354, "avg_price_4rm": 430000, "avg_lease": 1995},
}

# Flat type to typical floor area mapping
FLAT_TYPE_AREAS = {
    "2 ROOM": (45, 50),
    "3 ROOM": (65, 75),
    "4 ROOM": (90, 100),
    "5 ROOM": (110, 120),
    "EXECUTIVE": (145, 155),
    "MULTI-GENERATION": (160, 170)
}

# Flat models with availability
FLAT_MODELS = ["Improved", "New Generation", "Model A", "Standard", "Simplified", 
               "Premium Apartment", "Maisonette", "Apartment", "DBSS", "Model A2"]

STOREY_OPTIONS = ["01 TO 03", "04 TO 06", "07 TO 09", "10 TO 12", "13 TO 15", 
                  "16 TO 18", "19 TO 21", "22 TO 24", "25 TO 27"]


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance in km."""
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return 6371 * 2 * asin(sqrt(a))


# ============================================================================
# SCORING FUNCTIONS
# ============================================================================

def calculate_travel_score(flat_lat: float, flat_lon: float, destinations: List[Dict]) -> float:
    """Calculate travel convenience score (35% weight)."""
    if not destinations:
        return 50.0
    
    total_weighted_distance = 0
    total_weight = 0
    
    for dest in destinations:
        dest_lat = dest.get('lat')
        dest_lon = dest.get('lon')
        if dest_lat is None or dest_lon is None:
            continue
        
        distance = haversine_distance(flat_lat, flat_lon, dest_lat, dest_lon)
        weight = FREQUENCY_WEIGHTS.get(dest.get('frequency', 'weekly'), 1.0)
        
        total_weighted_distance += distance * weight
        total_weight += weight
    
    if total_weight == 0:
        return 50.0
    
    weighted_avg = total_weighted_distance / total_weight
    score = max(0, 100 - (weighted_avg / MAX_TRAVEL_DISTANCE_KM * 100))
    return round(score, 1)


def calculate_value_score(price_per_sqm: float, all_ppsm: np.ndarray) -> float:
    """Calculate value efficiency score (25% weight)."""
    if len(all_ppsm) <= 1:
        return 50.0
    
    min_ppsm = np.min(all_ppsm)
    max_ppsm = np.max(all_ppsm)
    
    if max_ppsm == min_ppsm:
        return 50.0
    
    score = 100 * (1 - (price_per_sqm - min_ppsm) / (max_ppsm - min_ppsm))
    return round(max(0, min(100, score)), 1)


def calculate_budget_score(price: float, min_budget: float, max_budget: float) -> float:
    """Calculate budget comfort score (20% weight).
    
    Formula from spec:
    budget_score = 100 - |predicted_price - mid_budget| / (max_budget - min_budget) × 100
    
    Example: Budget $400K-$600K, Price $480K
    mid = $500K, range = $200K
    score = 100 - |480-500|/200 × 100 = 100 - 10 = 90
    """
    mid = (min_budget + max_budget) / 2
    budget_range = max_budget - min_budget
    
    if budget_range == 0:
        return 100.0 if price == mid else 0.0
    
    score = 100 - (abs(price - mid) / budget_range) * 100
    return round(max(0, min(100, score)), 1)


def calculate_amenity_score(dist_mrt: float, dist_school: float, 
                            dist_mall: float, dist_hawker: float) -> float:
    """Calculate amenity access score (15% weight)."""
    raw = (AMENITY_WEIGHTS['mrt'] / (1 + dist_mrt) +
           AMENITY_WEIGHTS['school'] / (1 + dist_school) +
           AMENITY_WEIGHTS['mall'] / (1 + dist_mall) +
           AMENITY_WEIGHTS['hawker'] / (1 + dist_hawker))
    return round(min(100, raw * 100), 1)


def calculate_space_score(flat_area: float, min_area: float, max_area: float) -> float:
    """Calculate space adequacy score (5% weight)."""
    preferred = (min_area + max_area) / 2
    if preferred == 0:
        return 50.0
    score = min(100, (flat_area / preferred) * 100)
    return round(max(0, score), 1)


def calculate_final_score(travel: float, value: float, budget: float, 
                          amenity: float, space: float) -> float:
    """Calculate weighted final score."""
    return round(
        SCORE_WEIGHTS['travel'] * travel +
        SCORE_WEIGHTS['value'] * value +
        SCORE_WEIGHTS['budget'] * budget +
        SCORE_WEIGHTS['amenity'] * amenity +
        SCORE_WEIGHTS['space'] * space, 1)


# ============================================================================
# DESTINATION PARSER
# ============================================================================

def parse_destinations(user_input: Dict, location_data: Dict = None) -> List[Dict]:
    """Parse user destinations to standardized format with coordinates."""
    destinations = []
    
    # Build school lookup dict
    school_coords = {}
    if location_data and location_data.get('schools'):
        for s in location_data['schools']:
            name = s.get('school_name', s.get('name', ''))
            lat = s.get('latitude', s.get('lat'))
            lon = s.get('longitude', s.get('lon'))
            if name and isinstance(name, str) and lat and lon:
                school_coords[name.upper()] = (lat, lon)
    
    # Build POI lookup dict
    poi_coords = {}
    if location_data and location_data.get('pois'):
        for category, pois in location_data['pois'].items():
            for p in pois:
                name = p.get('name', '')
                if name and isinstance(name, str) and p.get('lat') and p.get('lon'):
                    poi_coords[name.upper()] = (p['lat'], p['lon'])
    
    # Work locations
    for work in user_input.get('workLocations', []):
        location = work.get('location', '')
        if not location or not isinstance(location, str):
            continue
            
        lat, lon = None, None
        
        # Try work location coords first
        if location in WORK_LOCATION_COORDS:
            lat, lon = WORK_LOCATION_COORDS[location]
        # Try POI lookup
        elif location.upper() in poi_coords:
            lat, lon = poi_coords[location.upper()]
        
        if lat and lon:
            destinations.append({
                'name': f"Work ({work.get('person', 'You')})",
                'lat': lat, 'lon': lon,
                'frequency': work.get('frequency', 'Daily (5x per week)')
            })
    
    # School locations (daily frequency)
    for school in user_input.get('schoolLocations', []):
        school_name = school.get('school', '')
        if not school_name or not isinstance(school_name, str):
            continue
            
        lat, lon = 1.3521, 103.8198  # Default to Singapore center
        
        # Look up actual school coordinates
        if school_name.upper() in school_coords:
            lat, lon = school_coords[school_name.upper()]
        
        destinations.append({
            'name': f"School ({school.get('child', 'Child')})",
            'lat': lat, 'lon': lon,
            'frequency': 'Daily (5x per week)'
        })
    
    # Parents' homes
    for parent in user_input.get('parentsHomes', []):
        location = parent.get('location', '')
        if not location or not isinstance(location, str):
            continue
            
        lat, lon = None, None
        
        # Try town lookup first
        for town, data in TOWN_DATA.items():
            if town.lower() in location.lower() or location.lower() in town.lower():
                lat, lon = data['lat'], data['lon']
                break
        
        if lat and lon:
            destinations.append({
                'name': f"Parents ({parent.get('parent', 'Parent')})",
                'lat': lat, 'lon': lon,
                'frequency': parent.get('frequency', 'Weekly (1x per week)')
            })
    
    # Other destinations (use POI lookup)
    for other in user_input.get('otherDestinations', []):
        location = other.get('location', '')
        if not location or not isinstance(location, str):
            continue
            
        lat, lon = 1.3521, 103.8198  # Default
        
        # Try work location coords
        if location in WORK_LOCATION_COORDS:
            lat, lon = WORK_LOCATION_COORDS[location]
        # Try POI lookup
        elif location.upper() in poi_coords:
            lat, lon = poi_coords[location.upper()]
        # Try town lookup
        else:
            for town, data in TOWN_DATA.items():
                if town.lower() in location.lower():
                    lat, lon = data['lat'], data['lon']
                    break
        
        destinations.append({
            'name': other.get('name', 'Other'),
            'lat': lat, 'lon': lon,
            'frequency': other.get('frequency', 'Weekly (1x per week)')
        })
    
    return destinations


# ============================================================================
# CANDIDATE GENERATOR (REAL DATA)
# ============================================================================

# Global cache for HDB data
_hdb_data_cache = None

def load_hdb_data(data_path: str = None) -> pd.DataFrame:
    """Load HDB resale dataset with caching."""
    global _hdb_data_cache
    
    if _hdb_data_cache is not None:
        return _hdb_data_cache
    
    if data_path is None:
        # Default path - adjust based on your setup
        from pathlib import Path
        data_path = Path(__file__).parent / "data" / "Complete_HDB_resale_dataset.csv"
    
    if not Path(data_path).exists():
        print(f"WARNING: HDB dataset not found at {data_path}")
        return None
    
    print(f"Loading HDB dataset from {data_path}...")
    df = pd.read_csv(data_path)
    
    # Parse remaining_lease to numeric years
    if 'remaining_lease' in df.columns and df['remaining_lease'].dtype == 'object':
        def parse_lease(lease_str):
            if pd.isna(lease_str):
                return None
            if isinstance(lease_str, (int, float)):
                return float(lease_str)
            # Parse "61 years 04 months" format
            import re
            match = re.match(r'(\d+)\s*years?(?:\s*(\d+)\s*months?)?', str(lease_str))
            if match:
                years = int(match.group(1))
                months = int(match.group(2)) if match.group(2) else 0
                return years + months / 12
            return None
        df['remaining_lease_years'] = df['remaining_lease'].apply(parse_lease)
    else:
        df['remaining_lease_years'] = df.get('remaining_lease', 99)
    
    # Ensure lat/lon are numeric
    df['latitude'] = pd.to_numeric(df['latitude'], errors='coerce')
    df['longitude'] = pd.to_numeric(df['longitude'], errors='coerce')
    
    # Standardize town names
    df['town'] = df['town'].str.upper().str.strip()
    df['flat_type'] = df['flat_type'].str.upper().str.strip()
    
    _hdb_data_cache = df
    print(f"Loaded {len(df)} HDB transactions")
    return df


def generate_candidates(
    user_input: Dict,
    calculate_distances_fn: Callable,
    predict_price_fn: Callable,
    mappings: Dict,
    hdb_data: pd.DataFrame = None,
    timeout_seconds: float = 30.0  # Max processing time
) -> List[Dict]:
    """
    Filter real HDB transactions based on user criteria.
    This is the HARD FILTERING stage from the spec.
    """
    import time
    start_time = time.time()
    
    # Load data if not provided
    if hdb_data is None:
        hdb_data = load_hdb_data()
    
    if hdb_data is None or len(hdb_data) == 0:
        print("WARNING: No HDB data available, falling back to synthetic")
        return generate_candidates_synthetic(user_input, calculate_distances_fn, predict_price_fn, mappings)
    
    # Get user preferences
    target_year = user_input.get('targetYear', 2026)
    budget = user_input.get('budget', [0, float('inf')])
    min_budget, max_budget = budget[0], budget[1]
    
    towns = user_input.get('towns', [])
    flat_types = user_input.get('flatTypes', [])
    flat_models = user_input.get('flatModels', [])
    floor_area_range = user_input.get('floorArea', [0, 200])
    lease_range = user_input.get('leaseRange', [0, 99])
    storey_ranges = user_input.get('storeyRanges', [])
    max_distances = user_input.get('maxDistances', {})
    
    # Start with full dataset
    df = hdb_data.copy()
    initial_count = len(df)
    
    # ==========================================
    # HARD FILTERING (from spec section 5.2.2)
    # ==========================================
    
    # Filter by budget (using historical prices as reference)
    # Apply price adjustment factor for target year
    current_year = 2025
    price_growth_rate = 0.03  # ~3% annual appreciation
    years_ahead = target_year - current_year
    price_factor = (1 + price_growth_rate) ** years_ahead
    
    adjusted_min = min_budget / price_factor
    adjusted_max = max_budget / price_factor
    df = df[(df['resale_price'] >= adjusted_min * 0.8) & (df['resale_price'] <= adjusted_max * 1.2)]
    
    # Filter by town
    if towns:
        towns_upper = [t.upper().strip() for t in towns]
        df = df[df['town'].isin(towns_upper)]
    
    # Filter by flat type
    if flat_types:
        types_upper = [t.upper().strip() for t in flat_types]
        df = df[df['flat_type'].isin(types_upper)]
    
    # Filter by flat model
    if flat_models:
        models_pattern = '|'.join([m.lower() for m in flat_models])
        df = df[df['flat_model'].str.lower().str.contains(models_pattern, na=False)]
    
    # Filter by floor area
    df = df[(df['floor_area_sqm'] >= floor_area_range[0]) & 
            (df['floor_area_sqm'] <= floor_area_range[1])]
    
    # Filter by remaining lease
    df = df[(df['remaining_lease_years'] >= lease_range[0]) & 
            (df['remaining_lease_years'] <= lease_range[1])]
    
    # Filter by storey range
    if storey_ranges:
        df = df[df['storey_range'].isin(storey_ranges)]
    
    # Remove rows with missing coordinates
    df = df.dropna(subset=['latitude', 'longitude'])
    
    print(f"Hard filtering: {initial_count} -> {len(df)} candidates")
    
    if len(df) == 0:
        return []
    
    # ==========================================
    # CALCULATE AMENITY DISTANCES
    # ==========================================
    
    candidates = []
    
    # Smart sampling: Ensure town coverage while limiting total candidates
    MAX_CANDIDATES_TO_PROCESS = 2000  # Limit for performance
    
    if len(df) > MAX_CANDIDATES_TO_PROCESS:
        # Stratified sampling by town to ensure coverage
        towns_in_df = df['town'].unique()
        samples_per_town = max(50, MAX_CANDIDATES_TO_PROCESS // len(towns_in_df))
        
        sampled_dfs = []
        for town in towns_in_df:
            town_df = df[df['town'] == town]
            n_samples = min(len(town_df), samples_per_town)
            sampled_dfs.append(town_df.sample(n=n_samples, random_state=42))
        
        df = pd.concat(sampled_dfs, ignore_index=True)
        print(f"Stratified sampling: {len(df)} candidates ({samples_per_town} per town)")
    else:
        print(f"Processing {len(df)} candidates...")
    
    # Early exit threshold - stop after finding enough good candidates
    MAX_GOOD_CANDIDATES = 500
    
    for idx, row in df.iterrows():
        # Check timeout
        if time.time() - start_time > timeout_seconds:
            print(f"Timeout reached ({timeout_seconds}s), returning {len(candidates)} candidates")
            break
        
        lat, lon = row['latitude'], row['longitude']
        
        # Calculate distances to amenities (returns long keys)
        distances_raw = calculate_distances_fn(lat, lon)
        
        # Create distances dict with both long and short keys
        distances = {
            **distances_raw,
            'mrt': distances_raw.get('distance_to_nearest_mrt_km', 999),
            'school': distances_raw.get('distance_to_nearest_primary_school_km', 999),
            'mall': distances_raw.get('distance_to_nearest_mall_km', 999),
            'hawker': distances_raw.get('distance_to_nearest_hawker_km', 999),
        }
        
        # Apply strict amenity filters if specified
        if max_distances.get('mrt') and distances.get('mrt', 999) > max_distances['mrt']:
            continue
        if max_distances.get('school') and distances.get('school', 999) > max_distances['school']:
            continue
        if max_distances.get('mall') and distances.get('mall', 999) > max_distances['mall']:
            continue
        if max_distances.get('hawker') and distances.get('hawker', 999) > max_distances['hawker']:
            continue
        
        # Parse floor level from storey range
        storey_range = row['storey_range']
        try:
            floor_level = int(storey_range.split(' TO ')[0])
        except:
            floor_level = 5  # Default mid-level
        
        # Predict price for target year using hybrid model
        try:
            predicted_price = predict_price_fn(
                town=row['town'],
                flat_type=row['flat_type'],
                flat_model=row.get('flat_model', 'Model A'),
                floor_area_sqm=row['floor_area_sqm'],
                floor_level=floor_level,
                lease_commence_year=row.get('lease_commence_year', 1990),
                year=target_year,
                lat=lat,
                lon=lon,
                distances=distances
            )
        except Exception as e:
            print(f"Price prediction failed for {row['town']}: {e}")
            continue
        
        # Final budget check with predicted price
        if predicted_price < min_budget or predicted_price > max_budget:
            continue
        
        candidates.append({
            'id': len(candidates) + 1,
            'town': row['town'],
            'flat_type': row['flat_type'],
            'flat_model': row.get('flat_model', 'Unknown'),
            'block': row.get('block', ''),
            'street_name': row.get('street_name', ''),
            'floor_area_sqm': float(row['floor_area_sqm']),
            'storey_range': row['storey_range'],
            'lease_commence_year': int(row.get('lease_commence_year', 1990)),
            'remaining_lease': float(row.get('remaining_lease_years', 60)),
            'latitude': float(lat),
            'longitude': float(lon),
            'historical_price': float(row['resale_price']),
            'predicted_price': round(predicted_price, 0),
            'distances': distances
        })
        
        # Early exit if we have enough good candidates
        if len(candidates) >= MAX_GOOD_CANDIDATES:
            print(f"Early exit: Found {MAX_GOOD_CANDIDATES} candidates")
            break
    
    elapsed = time.time() - start_time
    print(f"After amenity filters: {len(candidates)} candidates (processed in {elapsed:.2f}s)")
    return candidates


def generate_candidates_synthetic(
    user_input: Dict,
    calculate_distances_fn: Callable,
    predict_price_fn: Callable,
    mappings: Dict
) -> List[Dict]:
    """
    Fallback: Generate synthetic candidates if real data unavailable.
    """
    candidates = []
    
    # Get user preferences
    target_year = user_input.get('targetYear', 2026)
    budget = user_input.get('budget', [0, float('inf')])
    min_budget, max_budget = budget[0], budget[1]
    
    towns = user_input.get('towns', [])
    if not towns:
        towns = list(TOWN_DATA.keys())
    
    flat_types = user_input.get('flatTypes', [])
    if not flat_types:
        flat_types = ['3 ROOM', '4 ROOM', '5 ROOM']
    
    flat_models = user_input.get('flatModels', [])
    if not flat_models:
        flat_models = ['Improved', 'Model A', 'New Generation']
    
    floor_area_range = user_input.get('floorArea', [70, 120])
    lease_range = user_input.get('leaseRange', [30, 99])
    storey_ranges = user_input.get('storeyRanges', [])
    if not storey_ranges:
        storey_ranges = ["04 TO 06", "07 TO 09", "10 TO 12", "13 TO 15"]
    
    max_distances = user_input.get('maxDistances', {})
    
    # Generate candidate combinations
    candidate_id = 0
    
    for town in towns:
        if town not in TOWN_DATA:
            continue
        
        town_info = TOWN_DATA[town]
        
        for flat_type in flat_types:
            if flat_type not in FLAT_TYPE_AREAS:
                continue
            
            area_min, area_max = FLAT_TYPE_AREAS[flat_type]
            
            # Check floor area constraints
            if area_max < floor_area_range[0] or area_min > floor_area_range[1]:
                continue
            
            for flat_model in flat_models[:3]:  # Limit models per combination
                for storey in storey_ranges[:3]:  # Limit storey variations
                    # Generate a few variations per combination
                    for variation in range(2):
                        # Randomize within reasonable bounds
                        lat = town_info['lat'] + random.uniform(-0.01, 0.01)
                        lon = town_info['lon'] + random.uniform(-0.01, 0.01)
                        
                        # Floor area within type bounds and user preference
                        floor_area = random.uniform(
                            max(area_min, floor_area_range[0]),
                            min(area_max, floor_area_range[1])
                        )
                        
                        # Lease commence year based on town average + variation
                        base_lease = town_info.get('avg_lease', 1990)
                        lease_year = base_lease + random.randint(-5, 10)
                        lease_year = max(1966, min(2020, lease_year))
                        
                        remaining_lease = 99 - (target_year - lease_year)
                        
                        # Check lease constraint
                        if remaining_lease < lease_range[0] or remaining_lease > lease_range[1]:
                            continue
                        
                        # Floor level from storey range
                        storey_parts = storey.split(' TO ')
                        floor_level = int(storey_parts[0]) + random.randint(0, 2)
                        
                        # Calculate distances
                        try:
                            distances = calculate_distances_fn(lat, lon)
                        except:
                            distances = {
                                'distance_to_nearest_mrt_km': random.uniform(0.2, 1.5),
                                'distance_to_nearest_primary_school_km': random.uniform(0.2, 0.8),
                                'distance_to_nearest_mall_km': random.uniform(0.3, 2.0),
                                'distance_to_nearest_hawker_km': random.uniform(0.2, 1.0),
                                'distance_to_cbd_km': random.uniform(5, 20),
                                'distance_to_nearest_high_value_school_km': random.uniform(0.5, 3.0)
                            }
                        
                        # Check max distance constraints
                        if max_distances.get('mrt') and distances.get('distance_to_nearest_mrt_km', 0) > max_distances['mrt']:
                            continue
                        if max_distances.get('school') and distances.get('distance_to_nearest_primary_school_km', 0) > max_distances['school']:
                            continue
                        if max_distances.get('mall') and distances.get('distance_to_nearest_mall_km', 0) > max_distances['mall']:
                            continue
                        if max_distances.get('hawker') and distances.get('distance_to_nearest_hawker_km', 0) > max_distances['hawker']:
                            continue
                        
                        # Predict price using hybrid model
                        try:
                            predicted_price = predict_price_fn(
                                town=town,
                                flat_type=flat_type,
                                flat_model=flat_model,
                                floor_area_sqm=floor_area,
                                floor_level=floor_level,
                                lease_commence_year=lease_year,
                                year=target_year,
                                lat=lat, lon=lon,
                                distances=distances
                            )
                        except Exception as e:
                            # Fallback to estimate
                            base_price = town_info['avg_price_4rm']
                            type_mult = {'3 ROOM': 0.75, '4 ROOM': 1.0, '5 ROOM': 1.25, 'EXECUTIVE': 1.5}.get(flat_type, 1.0)
                            predicted_price = base_price * type_mult * (1.035 ** (target_year - 2024))
                        
                        # Check budget
                        if predicted_price < min_budget or predicted_price > max_budget:
                            continue
                        
                        candidate_id += 1
                        candidates.append({
                            'id': candidate_id,
                            'town': town,
                            'flat_type': flat_type,
                            'flat_model': flat_model,
                            'floor_area_sqm': round(floor_area, 1),
                            'storey_range': storey,
                            'floor_level': floor_level,
                            'lease_commence_year': lease_year,
                            'remaining_lease': remaining_lease,
                            'latitude': lat,
                            'longitude': lon,
                            'predicted_price': round(predicted_price, 0),
                            'distances': distances
                        })
                        
                        # Limit candidates per town
                        if len([c for c in candidates if c['town'] == town]) >= 20:
                            break
    
    return candidates


# ============================================================================
# MAIN RECOMMENDATION FUNCTION
# ============================================================================

def generate_recommendations(
    user_input: Dict,
    calculate_distances_fn: Callable,
    predict_price_fn: Callable,
    mappings: Dict,
    location_data: Dict = None,
    hdb_data: pd.DataFrame = None,
    top_n: int = 10
) -> Dict[str, Any]:
    """
    Generate top-N flat recommendations using REAL HDB data.
    
    Args:
        user_input: User preferences from frontend
        calculate_distances_fn: Function to calculate amenity distances
        predict_price_fn: Function to predict price using hybrid model
        mappings: Town/flat type/model mappings
        location_data: Schools and POIs data for coordinate lookup
        hdb_data: Real HDB transaction dataset
        top_n: Number of recommendations
    
    Returns:
        Dict with total_candidates and recommendations list
    """
    # Parse destinations
    destinations = parse_destinations(user_input, location_data)
    
    # Generate candidates from REAL data
    candidates = generate_candidates(
        user_input, 
        calculate_distances_fn, 
        predict_price_fn,
        mappings,
        hdb_data=hdb_data
    )
    
    if not candidates:
        return {
            'total_candidates': 0,
            'recommendations': [],
            'message': 'No flats match your criteria. Try relaxing some filters.'
        }
    
    # Get budget for scoring
    budget = user_input.get('budget', [0, 1000000])
    min_budget, max_budget = budget[0], budget[1]
    floor_area_range = user_input.get('floorArea', [70, 120])
    
    # Calculate price per sqm for all candidates
    for c in candidates:
        c['price_per_sqm'] = c['predicted_price'] / c['floor_area_sqm']
    
    all_ppsm = np.array([c['price_per_sqm'] for c in candidates])
    
    # Score each candidate
    results = []
    for c in candidates:
        dist = c['distances']
        
        travel = calculate_travel_score(c['latitude'], c['longitude'], destinations)
        value = calculate_value_score(c['price_per_sqm'], all_ppsm)
        budget_score = calculate_budget_score(c['predicted_price'], min_budget, max_budget)
        amenity = calculate_amenity_score(
            dist.get('distance_to_nearest_mrt_km', 1.0),
            dist.get('distance_to_nearest_primary_school_km', 0.5),
            dist.get('distance_to_nearest_mall_km', 1.0),
            dist.get('distance_to_nearest_hawker_km', 0.5)
        )
        space = calculate_space_score(c['floor_area_sqm'], floor_area_range[0], floor_area_range[1])
        final = calculate_final_score(travel, value, budget_score, amenity, space)
        
        price = c['predicted_price']
        results.append({
            'id': c['id'],
            'town': c['town'],
            'flatType': c['flat_type'],
            'flatModel': c['flat_model'],
            'predictedPrice': int(round(price / 1000) * 1000),
            'priceRange': {
                'low': int(price * 0.94 / 1000) * 1000,
                'high': int(price * 1.06 / 1000) * 1000
            },
            'floorArea': {
                'min': int(c['floor_area_sqm'] - 5),
                'max': int(c['floor_area_sqm'] + 5)
            },
            'storeyRange': c['storey_range'],
            'remainingLease': c['remaining_lease'],
            'distances': {
                'mrt': round(dist.get('distance_to_nearest_mrt_km', 0.5), 1),
                'school': round(dist.get('distance_to_nearest_primary_school_km', 0.5), 1),
                'mall': round(dist.get('distance_to_nearest_mall_km', 1.0), 1),
                'hawker': round(dist.get('distance_to_nearest_hawker_km', 0.5), 1)
            },
            'matchScore': int(round(final)),
            'scores': {
                'travel': travel,
                'value': value,
                'budget': budget_score,
                'amenity': amenity,
                'space': space,
                'final': final
            }
        })
    
    # Sort by score and return top N
    results.sort(key=lambda x: x['matchScore'], reverse=True)
    
    return {
        'total_candidates': len(candidates),
        'recommendations': results[:top_n]
    }