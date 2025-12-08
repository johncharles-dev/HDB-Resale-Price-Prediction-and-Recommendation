"""
Test Script for Try 2: Geocoding-Based Prediction
=================================================
Run this on your local machine to test all components.

Usage: python test_try2.py
"""

import requests
import sys

print("="*60)
print("TEST 1: OneMap Geocoding API")
print("="*60)

def test_geocoding():
    """Test OneMap API with real addresses"""
    test_addresses = [
        ("123", "Bedok North Road"),
        ("456", "Ang Mo Kio Avenue 10"),
        ("789", "Tampines Street 81"),
        ("101", "Jurong West Street 42"),
        ("999", "Fake Street That Does Not Exist"),  # Should fail
    ]
    
    results = []
    for block, street in test_addresses:
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
                print(f"✅ {block} {street}")
                print(f"   Lat: {result['LATITUDE']}, Lng: {result['LONGITUDE']}")
                print(f"   Address: {result['ADDRESS']}\n")
                results.append(True)
            else:
                print(f"❌ {block} {street} - NOT FOUND (expected for fake address)\n")
                results.append(False)
        except Exception as e:
            print(f"❌ {block} {street} - ERROR: {e}\n")
            results.append(False)
    
    success = sum(results[:4])  # First 4 should succeed
    print(f"Geocoding Test: {success}/4 real addresses found")
    return success >= 3  # At least 3 should work

print("\n" + "="*60)
print("TEST 2: Distance Calculation")
print("="*60)

def test_distance_calculation():
    """Test distance calculation with known coordinates"""
    import numpy as np
    
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calculate distance in km"""
        R = 6371
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        return 2 * R * np.arcsin(np.sqrt(a))
    
    # Test: Bedok to Raffles Place (CBD) - should be ~12-15 km
    bedok = (1.324, 103.930)
    raffles = (1.284, 103.851)
    
    dist = haversine_distance(bedok[0], bedok[1], raffles[0], raffles[1])
    print(f"Bedok to Raffles Place: {dist:.2f} km")
    
    if 10 < dist < 20:
        print("✅ Distance calculation looks correct!")
        return True
    else:
        print("❌ Distance seems wrong")
        return False


print("\n" + "="*60)
print("TEST 3: Load Amenity Data Files")
print("="*60)

def test_data_files():
    """Test if all required data files exist and load correctly"""
    import pandas as pd
    
    files_to_check = [
        ('03_dataset_for_ML_model/Primary_school_dataset.csv', 'Primary Schools'),
        ('03_dataset_for_ML_model/Ballot_school.csv', 'High-Value Schools'),
        ('03_dataset_for_ML_model/MRT_datasets.csv', 'MRT Stations'),
        ('03_dataset_for_ML_model/Hawker_Centers_datasets.csv', 'Hawker Centers'),
        ('03_dataset_for_ML_model/Malls_datasets.csv', 'Malls'),
        ('03_dataset_for_ML_model/singapore_business_district.csv', 'CBD'),
    ]
    
    all_good = True
    for filepath, name in files_to_check:
        try:
            df = pd.read_csv(filepath)
            if 'latitude' in df.columns and 'longitude' in df.columns:
                print(f"✅ {name}: {len(df)} records with lat/lng")
            else:
                print(f"⚠️ {name}: loaded but missing lat/lng columns")
                all_good = False
        except FileNotFoundError:
            print(f"❌ {name}: FILE NOT FOUND at {filepath}")
            all_good = False
        except Exception as e:
            print(f"❌ {name}: ERROR - {e}")
            all_good = False
    
    return all_good


print("\n" + "="*60)
print("TEST 4: Load Model and Mappings")
print("="*60)

def test_model_and_mappings():
    """Test if model and mapping files load correctly"""
    import joblib
    import pandas as pd
    
    # Test model
    try:
        model = joblib.load('Model_Building/xgb_resale_all.joblib')
        print(f"✅ Model loaded: {type(model).__name__}")
    except FileNotFoundError:
        print("❌ Model not found at Model_Building/xgb_resale_all.joblib")
        return False
    except Exception as e:
        print(f"❌ Model error: {e}")
        return False
    
    # Test mappings
    mappings = [
        'Model_Building/mappings_csv/town_code_map.csv',
        'Model_Building/mappings_csv/flat_type_int_map.csv',
        'Model_Building/mappings_csv/flat_model_code_map.csv',
        'Model_Building/mappings_csv/region_code_map.csv',
    ]
    
    for filepath in mappings:
        try:
            df = pd.read_csv(filepath)
            print(f"✅ {filepath.split('/')[-1]}: {len(df)} entries")
        except Exception as e:
            print(f"❌ {filepath}: {e}")
            return False
    
    return True


print("\n" + "="*60)
print("TEST 5: Full Prediction Pipeline")
print("="*60)

def test_full_prediction():
    """Test complete prediction with a real address"""
    try:
        from try2_prediction_helper import (
            get_coordinates,
            load_mappings,
            DistanceCalculator,
            predict_price_try2
        )
        import joblib
        
        # Load resources
        print("Loading resources...")
        mappings = load_mappings()
        distance_calc = DistanceCalculator()
        model = joblib.load('Model_Building/xgb_resale_all.joblib')
        
        # Test input
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
        
        print(f"\nTest Input: Block {user_input['block']} {user_input['street']}")
        
        # Run prediction
        result = predict_price_try2(user_input, model, mappings, distance_calc)
        
        if result['success']:
            print(f"\n✅ PREDICTION SUCCESSFUL!")
            print(f"   Coordinates: ({result['coordinates']['latitude']:.4f}, {result['coordinates']['longitude']:.4f})")
            print(f"   Distances calculated:")
            for k, v in result['distances'].items():
                print(f"      {k}: {v:.4f} km")
            print(f"\n   💰 PREDICTED PRICE: {result['formatted_price']}")
            return True
        else:
            print(f"❌ Prediction failed: {result['error']}")
            return False
            
    except ImportError as e:
        print(f"❌ Import error - make sure try2_prediction_helper.py is in same folder")
        print(f"   Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False


# ============================================
# RUN ALL TESTS
# ============================================

if __name__ == "__main__":
    print("\n" + "="*60)
    print("RUNNING ALL TESTS FOR TRY 2")
    print("="*60 + "\n")
    
    results = {}
    
    # Test 1: Geocoding
    try:
        results['Geocoding'] = test_geocoding()
    except Exception as e:
        print(f"❌ Geocoding test error: {e}")
        results['Geocoding'] = False
    
    # Test 2: Distance
    try:
        results['Distance'] = test_distance_calculation()
    except Exception as e:
        print(f"❌ Distance test error: {e}")
        results['Distance'] = False
    
    # Test 3: Data files
    try:
        results['Data Files'] = test_data_files()
    except Exception as e:
        print(f"❌ Data files test error: {e}")
        results['Data Files'] = False
    
    # Test 4: Model
    try:
        results['Model'] = test_model_and_mappings()
    except Exception as e:
        print(f"❌ Model test error: {e}")
        results['Model'] = False
    
    # Test 5: Full pipeline (only if others passed)
    if all(results.values()):
        try:
            results['Full Pipeline'] = test_full_prediction()
        except Exception as e:
            print(f"❌ Full pipeline error: {e}")
            results['Full Pipeline'] = False
    else:
        print("\n⚠️ Skipping full pipeline test - fix above errors first")
        results['Full Pipeline'] = False
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test}: {status}")
    
    total_passed = sum(results.values())
    total_tests = len(results)
    print(f"\nTotal: {total_passed}/{total_tests} tests passed")
    
    if total_passed == total_tests:
        print("\n🎉 ALL TESTS PASSED! Ready to connect to frontend.")
    else:
        print("\n⚠️ Some tests failed. Fix issues before proceeding.")
