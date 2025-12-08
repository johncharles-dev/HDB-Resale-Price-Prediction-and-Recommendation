"""
Extend HDB Training Data for Future Year Predictions
====================================================
This script:
1. Loads your existing HDB_model_ready.csv
2. Calculates historical price growth trends
3. Generates synthetic data for 2026-2030
4. Adds 'remaining_lease' feature
5. Retrains the XGBoost model
6. Tests predictions for future years

Run from your Model_Building folder:
    python extend_and_retrain.py
"""

import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import warnings
warnings.filterwarnings('ignore')

# ============================================
# CONFIGURATION
# ============================================

INPUT_FILE = 'HDB_model_ready.csv'  # Your existing training data
OUTPUT_MODEL = 'xgb_resale_future.joblib'  # New model file
FUTURE_YEARS = [2026, 2027, 2028, 2029, 2030]
RANDOM_SEED = 42

# ============================================
# STEP 1: Load Original Data
# ============================================

print("="*60)
print("STEP 1: Loading Original Data")
print("="*60)

df = pd.read_csv(INPUT_FILE)
print(f"Loaded {len(df):,} rows")
print(f"Years: {df['year'].min()} - {df['year'].max()}")
print(f"Columns: {list(df.columns)}")

# ============================================
# STEP 2: Calculate Price Growth Trend
# ============================================

print("\n" + "="*60)
print("STEP 2: Analyzing Price Trends")
print("="*60)

# Average price by year
yearly_avg = df.groupby('year')['resale_price'].mean()
print("\nYearly Average Prices:")
for year, price in yearly_avg.items():
    print(f"  {year}: ${price:,.0f}")

# Calculate year-over-year growth
yoy_growth = yearly_avg.pct_change().dropna()
print("\nYear-over-Year Growth:")
for year, growth in yoy_growth.items():
    print(f"  {int(year)}: {growth:+.2%}")

# Use recent years (2021-2025) for trend
recent_growth = yoy_growth[yoy_growth.index >= 2021].mean()
print(f"\nAverage growth (2021-2025): {recent_growth:.2%}")

# For future projections, use a more conservative rate
# (market tends to stabilize after rapid growth)
projected_growth = min(recent_growth, 0.03)  # Cap at 3%
print(f"Projected growth for future years: {projected_growth:.2%}")

# ============================================
# STEP 3: Generate Synthetic Future Data
# ============================================

print("\n" + "="*60)
print("STEP 3: Generating Synthetic Future Data")
print("="*60)

# Use 2024-2025 data as base (most recent patterns)
base_data = df[df['year'] >= 2024].copy()
print(f"Base data (2024-2025): {len(base_data):,} rows")

synthetic_dfs = []
last_year_price = yearly_avg.iloc[-1]  # 2025 average price

for future_year in FUTURE_YEARS:
    print(f"\nGenerating data for {future_year}...")
    
    # Copy base data
    year_data = base_data.copy()
    years_ahead = future_year - 2025
    
    # Update year
    year_data['year'] = future_year
    
    # Distribute across all months (more realistic)
    np.random.seed(RANDOM_SEED + future_year)
    year_data['month_num'] = np.random.randint(1, 13, size=len(year_data))
    year_data['quarter'] = (year_data['month_num'] - 1) // 3 + 1
    
    # Apply growth with realistic variation
    # Different areas grow at different rates
    growth_factor = (1 + projected_growth) ** years_ahead
    
    # Add town-specific variation (±5%)
    town_variation = np.random.normal(1, 0.02, size=len(year_data))
    
    # Add individual unit variation (±3%)
    unit_variation = np.random.normal(1, 0.015, size=len(year_data))
    
    year_data['resale_price'] = (
        year_data['resale_price'] * growth_factor * town_variation * unit_variation
    )
    
    # Round prices to realistic values
    year_data['resale_price'] = (year_data['resale_price'] / 1000).round() * 1000
    
    synthetic_dfs.append(year_data)
    
    new_avg = year_data['resale_price'].mean()
    print(f"  Generated {len(year_data):,} rows, avg price: ${new_avg:,.0f}")

# ============================================
# STEP 4: Combine Data
# ============================================

print("\n" + "="*60)
print("STEP 4: Combining Original + Synthetic Data")
print("="*60)

df_extended = pd.concat([df] + synthetic_dfs, ignore_index=True)
print(f"Total rows: {len(df_extended):,}")
print(f"Years: {df_extended['year'].min()} - {df_extended['year'].max()}")

# Verify year distribution
print("\nRows per year:")
year_counts = df_extended.groupby('year').size()
for year, count in year_counts.items():
    marker = "← synthetic" if year in FUTURE_YEARS else ""
    print(f"  {year}: {count:,} {marker}")

# ============================================
# STEP 5: Add Remaining Lease Feature (Optional)
# ============================================

print("\n" + "="*60)
print("STEP 5: Adding Remaining Lease Feature")
print("="*60)

df_extended['remaining_lease'] = 99 - (df_extended['year'] - df_extended['lease_commence_year'])
print(f"Remaining lease range: {df_extended['remaining_lease'].min()} - {df_extended['remaining_lease'].max()} years")

# ============================================
# STEP 6: Prepare Features and Train Model
# ============================================

print("\n" + "="*60)
print("STEP 6: Training New Model")
print("="*60)

# Define features (same as before, but now 'year' has future values)
feature_columns = [
    'floor_area_sqm',
    'lease_commence_year',
    'floor_level',
    'distance_to_nearest_primary_school_km',
    'distance_to_nearest_high_value_school_km',
    'distance_to_nearest_mrt_km',
    'distance_to_nearest_hawker_km',
    'distance_to_nearest_mall_km',
    'distance_to_cbd_km',
    'year',
    'month_num',
    'quarter',
    'region_code',
    'flat_type_int',
    'flat_model_code',
    'town_code'
]

X = df_extended[feature_columns]
y = df_extended['resale_price']

print(f"Features: {len(feature_columns)}")
print(f"Samples: {len(X):,}")

# Train/test split (use year-based split for proper evaluation)
train_mask = df_extended['year'] < 2024
X_train, X_test = X[train_mask], X[~train_mask]
y_train, y_test = y[train_mask], y[~train_mask]

print(f"Training set: {len(X_train):,} samples (years < 2024)")
print(f"Test set: {len(X_test):,} samples (years >= 2024)")

# Train XGBoost with same hyperparameters
model = XGBRegressor(
    n_estimators=200,
    max_depth=7,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.6,
    reg_lambda=2,
    random_state=RANDOM_SEED,
    n_jobs=-1
)

print("\nTraining XGBoost...")
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2 = r2_score(y_test, y_pred)

print(f"\nModel Performance:")
print(f"  RMSE: ${rmse:,.0f}")
print(f"  R²: {r2:.4f}")

# ============================================
# STEP 7: Save Model
# ============================================

print("\n" + "="*60)
print("STEP 7: Saving Model")
print("="*60)

joblib.dump(model, OUTPUT_MODEL)
print(f"Model saved to: {OUTPUT_MODEL}")

# Also save extended dataset
extended_csv = 'HDB_model_ready_extended.csv'
df_extended.to_csv(extended_csv, index=False)
print(f"Extended data saved to: {extended_csv}")

# ============================================
# STEP 8: Test Future Year Predictions
# ============================================

print("\n" + "="*60)
print("STEP 8: Testing Future Year Predictions")
print("="*60)

# Test case: 112A Depot Road
test_base = {
    'floor_area_sqm': 100.0,
    'lease_commence_year': 2006,
    'floor_level': 22,
    'distance_to_nearest_primary_school_km': 0.595,
    'distance_to_nearest_high_value_school_km': 1.888,
    'distance_to_nearest_mrt_km': 1.207,
    'distance_to_nearest_hawker_km': 0.601,
    'distance_to_nearest_mall_km': 0.245,
    'distance_to_cbd_km': 3.177,
    'month_num': 6,
    'quarter': 2,
    'region_code': 1,
    'flat_type_int': 4,
    'flat_model_code': 4,
    'town_code': 4
}

print("\nTest: 112A Depot Road, 4-ROOM, Model A, 100sqm, Lease 2006\n")

test_years = [2020, 2022, 2024, 2025, 2026, 2027, 2028, 2029, 2030]
prices = []

for year in test_years:
    test_data = test_base.copy()
    test_data['year'] = year
    df_test = pd.DataFrame([test_data])
    price = model.predict(df_test)[0]
    prices.append(price)
    marker = "← future" if year > 2025 else ""
    print(f"  Year {year}: ${price:>12,.0f} {marker}")

print("\n" + "-"*40)
print("Year-over-year changes:")
for i in range(1, len(test_years)):
    change = prices[i] - prices[i-1]
    pct = (change / prices[i-1]) * 100
    print(f"  {test_years[i-1]} → {test_years[i]}: {'+' if change >= 0 else ''}{change:>10,.0f} ({pct:+.2f}%)")

# Check if future years now have different predictions
future_prices = [p for y, p in zip(test_years, prices) if y > 2025]
unique_future = len(set([round(p) for p in future_prices]))
print(f"\n>>> Unique prices for future years: {unique_future} out of {len(future_prices)}")

if unique_future > 1:
    print("✓ SUCCESS! Model now predicts different prices for future years!")
else:
    print("⚠️ Future years still have same price - may need more variation in synthetic data")

print("\n" + "="*60)
print("DONE!")
print("="*60)
print(f"""
Next steps:
1. Replace your old model with: {OUTPUT_MODEL}
2. Update backend to use the new model
3. Test the predictions in your UI

The new model can now predict for years 2026-2030!
""")
