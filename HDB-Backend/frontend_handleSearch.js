/**
 * Updated handleSearch for Hdbrecommendation.jsx
 * 
 * Calls the integrated /recommend endpoint on your existing backend.
 * Replace the existing handleSearch function with this code.
 */

// Your existing backend URL (same as prediction API)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Updated handleSearch - replace the existing function in Hdbrecommendation.jsx
 */
const handleSearch = async () => {
  setIsLoading(true);
  
  try {
    // Build request matching the API schema
    const requestBody = {
      targetYear: targetYear,
      budget: budget,
      towns: towns,
      flatTypes: flatTypes,
      flatModels: flatModels,
      floorArea: floorArea,
      storeyRanges: storeyRanges,
      leaseRange: leaseRange,
      maxDistances: {
        mrt: maxMrt,
        school: maxSchool,
        mall: maxMall,
        hawker: maxHawker
      },
      destinations: {
        workLocations: workLocations.map(w => ({
          person: w.person || 'You',
          location: w.location || '',
          frequency: w.frequency || 'Daily (5x per week)'
        })),
        schoolLocations: schoolLocations.map(s => ({
          child: s.child || 'Child 1',
          school: s.school || ''
        })),
        parentsHomes: parentsHomes.map(p => ({
          parent: p.parent || 'Parent 1',
          location: p.location || '',
          frequency: p.frequency || 'Weekly (1x per week)'
        })),
        otherDestinations: otherDestinations.map(o => ({
          name: o.name || '',
          location: o.location || '',
          category: o.category || 'Other',
          frequency: o.frequency || 'Weekly (1x per week)'
        }))
      }
    };
    
    console.log('Sending recommendation request:', requestBody);
    
    // Call the /recommend endpoint on your existing backend
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get recommendations');
    }
    
    console.log('Received recommendations:', data);
    console.log(`Total candidates: ${data.total_candidates}`);
    
    // The response already matches your UI format!
    setRecommendations(data.recommendations);
    setSubmittedYear(targetYear);
    
    if (data.message) {
      console.log('API Message:', data.message);
    }
    
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    alert(`Failed to get recommendations: ${error.message}`);
    setRecommendations(null);
  } finally {
    setIsLoading(false);
  }
};

export default handleSearch;


/**
 * =====================================
 * FULL INTEGRATION INSTRUCTIONS
 * =====================================
 * 
 * 1. Your backend now has a /recommend endpoint alongside /predict
 * 
 * 2. In Hdbrecommendation.jsx, find the handleSearch function and replace it with the one above
 * 
 * 3. Make sure API_BASE_URL points to your backend (default: http://localhost:8000)
 * 
 * 4. The response format matches your existing RecommendationCard expectations:
 *    {
 *      id: number,
 *      town: string,
 *      flatType: string,
 *      flatModel: string,
 *      predictedPrice: number,
 *      priceRange: { low: number, high: number },
 *      floorArea: { min: number, max: number },
 *      storeyRange: string,
 *      remainingLease: number,
 *      distances: { mrt: number, school: number, mall: number, hawker: number },
 *      matchScore: number (0-100),
 *      scores: { travel, value, budget, amenity, space, final }  // Detailed breakdown
 *    }
 * 
 * 5. Score weights (configurable in recommendation.py):
 *    - Travel: 35% (weighted distance to work/school/parents)
 *    - Value: 25% (price per sqm efficiency)
 *    - Budget: 20% (how comfortably fits budget)
 *    - Amenity: 15% (MRT, school, mall, hawker proximity)
 *    - Space: 5% (floor area vs preference)
 */
