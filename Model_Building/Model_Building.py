import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree

# Load all datasets
hdb_df = pd.read_csv('03_dataset_for_ML_model/Complete_HDB_resale_dataset_2017_to_2025.csv')
primary_schools = pd.read_csv('03_dataset_for_ML_model/Primary_school_dataset.csv')
mrt_stations = pd.read_csv('03_dataset_for_ML_model/MRT_datasets.csv')
hawker_centers = pd.read_csv('03_dataset_for_ML_model/Hawker_Centers_datasets.csv')
malls = pd.read_csv('03_dataset_for_ML_model/Malls_datasets.csv')

print(f"HDB records: {len(hdb_df)}")
print(f"Primary schools: {len(primary_schools)}")
print(f"MRT stations: {len(mrt_stations)}")
print(f"Hawker centers: {len(hawker_centers)}")
print(f"Malls: {len(malls)}")

# Function to calculate closest distance using BallTree (efficient for large datasets)
def get_closest_distance(hdb_coords, amenity_coords):
    """
    Calculate distance to closest amenity for each HDB flat
    Uses Haversine formula with BallTree for efficiency
    Returns distances in kilometers
    """
    # Convert to radians for Haversine formula
    hdb_radians = np.radians(hdb_coords)
    amenity_radians = np.radians(amenity_coords)
    
    # Build BallTree for efficient nearest neighbor search
    tree = BallTree(amenity_radians, metric='haversine')
    
    # Find closest amenity for each HDB flat
    distances, indices = tree.query(hdb_radians, k=1)
    
    # Convert from radians to kilometers (Earth radius = 6371 km)
    distances_km = distances * 6371
    
    return distances_km.flatten()

# Prepare coordinates for HDB flats
hdb_coords = hdb_df[['latitude', 'longitude']].values

# Calculate distances to each amenity type
print("\nCalculating distances to closest amenities...")

# 1. Distance to closest Primary School
primary_school_coords = primary_schools[['latitude', 'longitude']].values
hdb_df['distance_to_nearest_primary_school_km'] = get_closest_distance(hdb_coords, primary_school_coords)
print("✓ Primary schools done")

# 2. Distance to closest MRT
mrt_coords = mrt_stations[['latitude', 'longitude']].values
hdb_df['distance_to_nearest_mrt_km'] = get_closest_distance(hdb_coords, mrt_coords)
print("✓ MRT stations done")

# 3. Distance to closest Hawker Center
hawker_coords = hawker_centers[['latitude', 'longitude']].values
hdb_df['distance_to_nearest_hawker_km'] = get_closest_distance(hdb_coords, hawker_coords)
print("✓ Hawker centers done")

# 4. Distance to closest Mall
mall_coords = malls[['latitude', 'longitude']].values
hdb_df['distance_to_nearest_mall_km'] = get_closest_distance(hdb_coords, mall_coords)
print("✓ Malls done")

# Display summary statistics
print("\n" + "="*60)
print("DISTANCE SUMMARY (in kilometers)")
print("="*60)
print(hdb_df[['distance_to_nearest_primary_school_km', 
               'distance_to_nearest_mrt_km',
               'distance_to_nearest_hawker_km', 
               'distance_to_nearest_mall_km']].describe())

# Save the enhanced dataset
output_file = '03_dataset_for_ML_model/HDB_with_distances.csv'
hdb_df.to_csv(output_file, index=False)
print(f"\n✓ Enhanced dataset saved to: {output_file}")

# Show sample of results
print("\nSample of first 5 rows with new distance features:")
print(hdb_df[['town', 'street_name', 'resale_price',
              'distance_to_nearest_mrt_km', 
              'distance_to_nearest_hawker_km',
              'distance_to_nearest_mall_km',
              'distance_to_nearest_primary_school_km']].head())
