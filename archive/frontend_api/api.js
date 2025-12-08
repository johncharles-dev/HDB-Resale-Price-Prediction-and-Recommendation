/**
 * HDB Price Prediction API Service
 * Frontend client for connecting to FastAPI backend
 * Data Minions - SUTD Production Ready ML
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Predict HDB resale price
 * @param {Object} params - Prediction parameters
 * @returns {Promise<Object>} Prediction result
 */
export async function predictPrice({
  town,
  flatType,
  flatModel,
  storey,
  floorArea,
  leaseYear
}) {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      town: town.toUpperCase(),
      flat_type: flatType.toUpperCase(),
      flat_model: flatModel.toUpperCase(),
      storey_range: storey,
      floor_area_sqm: floorArea,
      lease_commence_year: leaseYear
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Prediction failed');
  }

  const data = await response.json();
  return {
    predictedPrice: data.predicted_price,
    priceLower: data.price_lower,
    priceUpper: data.price_upper,
    remainingLease: data.remaining_lease,
    confidence: data.confidence
  };
}

/**
 * Get multi-year price trajectory
 * @param {Object} params - Prediction parameters
 * @param {number[]} years - Years to predict
 * @returns {Promise<Object[]>} Array of yearly predictions
 */
export async function predictMultiYear({
  town,
  flatType,
  flatModel,
  storey,
  floorArea,
  leaseYear,
  years = [2024, 2025, 2026, 2027, 2028]
}) {
  const response = await fetch(`${API_BASE_URL}/predict/multi-year`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      town: town.toUpperCase(),
      flat_type: flatType.toUpperCase(),
      flat_model: flatModel.toUpperCase(),
      storey_range: storey,
      floor_area_sqm: floorArea,
      lease_commence_year: leaseYear,
      years
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Multi-year prediction failed');
  }

  const data = await response.json();
  return data.predictions.map(p => ({
    year: p.year,
    predictedPrice: p.predicted_price,
    remainingLease: p.remaining_lease
  }));
}

/**
 * Check API health status
 * @returns {Promise<Object>} Health status
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}

/**
 * Get available towns
 * @returns {Promise<string[]>} List of towns
 */
export async function getTowns() {
  const response = await fetch(`${API_BASE_URL}/towns`);
  const data = await response.json();
  return data.towns;
}

/**
 * Get available flat types
 * @returns {Promise<string[]>} List of flat types
 */
export async function getFlatTypes() {
  const response = await fetch(`${API_BASE_URL}/flat-types`);
  const data = await response.json();
  return data.flat_types;
}

/**
 * Get available flat models
 * @returns {Promise<string[]>} List of flat models
 */
export async function getFlatModels() {
  const response = await fetch(`${API_BASE_URL}/flat-models`);
  const data = await response.json();
  return data.flat_models;
}

export default {
  predictPrice,
  predictMultiYear,
  checkHealth,
  getTowns,
  getFlatTypes,
  getFlatModels
};
