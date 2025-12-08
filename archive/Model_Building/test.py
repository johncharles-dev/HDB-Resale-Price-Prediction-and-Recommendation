import pandas as pd
import joblib
import numpy as np

model = joblib.load('xgb_resale_all.joblib')

sample_data = pd.DataFrame([{
    'floor_area_sqm': 90.0,
    'lease_commence_year': 2010,
    'floor_level': 12,
    'distance_to_nearest_primary_school_km': 0,
    'distance_to_nearest_high_value_school_km': 0,
    'distance_to_nearest_mrt_km': 0,
    'distance_to_nearest_hawker_km': 0,
    'distance_to_nearest_mall_km': 0,
    'distance_to_cbd_km': 0,
    'year': 2027,
    'month_num': 5,
    'quarter': 2,
    'region_code': 1,
    'flat_type_int': 3,
    'flat_model_code': 18,
    'town_code': 5
}])

predicted_price = model.predict(sample_data)
print(f"Predicted resale price: {predicted_price[0]:,.2f}")

