import React, { useState } from 'react';

// ============== CONFIG ==============
const HDB_TOWNS = [
  "ANG MO KIO", "BEDOK", "BISHAN", "BUKIT BATOK", "BUKIT MERAH",
  "BUKIT PANJANG", "BUKIT TIMAH", "CENTRAL AREA", "CHOA CHU KANG",
  "CLEMENTI", "GEYLANG", "HOUGANG", "JURONG EAST", "JURONG WEST",
  "KALLANG/WHAMPOA", "MARINE PARADE", "PASIR RIS", "PUNGGOL",
  "QUEENSTOWN", "SEMBAWANG", "SENGKANG", "SERANGOON", "TAMPINES",
  "TOA PAYOH", "WOODLANDS", "YISHUN"
];

const FLAT_TYPES = ["2 ROOM", "3 ROOM", "4 ROOM", "5 ROOM", "EXECUTIVE"];

const FLAT_MODELS = [
  "Improved", "New Generation", "Model A", "Standard", "Simplified",
  "Premium Apartment", "Maisonette", "Apartment", "DBSS", "Model A2",
  "Premium Apartment Loft", "3Gen"
];

const STOREY_RANGES = [
  "01 TO 03", "04 TO 06", "07 TO 09", "10 TO 12", "13 TO 15",
  "16 TO 18", "19 TO 21", "22 TO 24", "25 TO 27", "28 TO 30",
  "31 TO 33", "34 TO 36", "37 TO 39", "40 TO 42", "43 TO 45"
];

const PREDICTION_YEARS = [2025, 2026, 2027, 2028];

// ============== PREDICTION LOGIC ==============
const predictMarketPrice = (features, year) => {
  // Base prices by flat type (2025 market baseline)
  const basePrices = {
    "2 ROOM": 320000,
    "3 ROOM": 420000,
    "4 ROOM": 550000,
    "5 ROOM": 680000,
    "EXECUTIVE": 780000
  };
  
  // Town location premiums
  const townMult = {
    "CENTRAL AREA": 1.55, "BUKIT TIMAH": 1.50, "QUEENSTOWN": 1.40,
    "BISHAN": 1.35, "TOA PAYOH": 1.28, "KALLANG/WHAMPOA": 1.25,
    "MARINE PARADE": 1.25, "CLEMENTI": 1.20, "BUKIT MERAH": 1.18,
    "ANG MO KIO": 1.15, "SERANGOON": 1.12, "GEYLANG": 1.10,
    "BEDOK": 1.08, "TAMPINES": 1.08, "HOUGANG": 1.02,
    "PASIR RIS": 1.00, "PUNGGOL": 1.02, "SENGKANG": 0.98,
    "BUKIT BATOK": 0.98, "BUKIT PANJANG": 0.95, "CHOA CHU KANG": 0.95,
    "JURONG EAST": 1.00, "JURONG WEST": 0.95, "SEMBAWANG": 0.90,
    "WOODLANDS": 0.92, "YISHUN": 0.95
  };
  
  // Flat model adjustments
  const modelMult = {
    "DBSS": 1.12, "Premium Apartment": 1.08, "Premium Apartment Loft": 1.15,
    "Maisonette": 1.05, "Model A": 1.02, "Improved": 1.00,
    "New Generation": 0.98, "Standard": 0.95, "Simplified": 0.92,
    "Apartment": 1.00, "Model A2": 1.00, "3Gen": 1.10
  };
  
  const base = basePrices[features.flatType] || 550000;
  const town = townMult[features.town] || 1.0;
  const model = modelMult[features.flatModel] || 1.0;
  
  // Floor area adjustment (baseline ~95 sqm for 4-room)
  const areaMult = features.floorArea / 95;
  
  // Storey premium
  const storeyNum = parseInt(features.storey.split(" ")[0]);
  const storeyMult = 1 + (storeyNum - 7) * 0.015;
  
  // Lease depreciation (remaining lease at prediction year)
  const remainingLease = 99 - (year - features.leaseYear);
  const leaseMult = remainingLease >= 70 ? 1.0 : 
                    remainingLease >= 50 ? 0.85 + (remainingLease - 50) * 0.0075 :
                    0.60 + (remainingLease / 50) * 0.25;
  
  // Market appreciation (~3.5% annually)
  const yearMult = Math.pow(1.035, year - 2025);
  
  // Calculate price
  const price = Math.round(base * town * model * areaMult * storeyMult * leaseMult * yearMult / 1000) * 1000;
  
  return {
    price,
    lower: Math.round(price * 0.94 / 1000) * 1000,
    upper: Math.round(price * 1.06 / 1000) * 1000,
    remainingLease
  };
};

// ============== COMPONENTS ==============
const Select = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
    <label className="block text-xs uppercase tracking-widest text-neutral-500">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3
                 text-white text-sm focus:outline-none focus:border-neutral-600 
                 transition-colors cursor-pointer hover:border-neutral-700"
    >
      {options.map(opt => (
        <option key={opt} value={opt} className="bg-neutral-900">{opt}</option>
      ))}
    </select>
  </div>
);

const Slider = ({ label, value, onChange, min, max, unit = "" }) => (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <label className="text-xs uppercase tracking-widest text-neutral-500">{label}</label>
      <span className="text-sm font-mono text-white bg-neutral-800 px-3 py-1 rounded-md">
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-neutral-800 rounded-full appearance-none cursor-pointer
                 [&::-webkit-slider-thumb]:appearance-none 
                 [&::-webkit-slider-thumb]:w-4 
                 [&::-webkit-slider-thumb]:h-4 
                 [&::-webkit-slider-thumb]:bg-white 
                 [&::-webkit-slider-thumb]:rounded-full 
                 [&::-webkit-slider-thumb]:cursor-pointer
                 [&::-webkit-slider-thumb]:transition-transform
                 [&::-webkit-slider-thumb]:hover:scale-110"
    />
  </div>
);

const PriceChart = ({ predictions, selectedYear, onSelectYear }) => {
  const prices = predictions.map(p => p.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;
  
  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs uppercase tracking-widest text-neutral-500">
          Price Trajectory
        </span>
        <span className="text-xs text-neutral-600">Click to select year</span>
      </div>
      
      <div className="flex items-end justify-between h-32 gap-3">
        {predictions.map(p => {
          const heightPercent = ((p.price - minPrice) / range) * 60 + 40;
          const isSelected = p.year === selectedYear;
          
          return (
            <button
              key={p.year}
              onClick={() => onSelectYear(p.year)}
              className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
            >
              <span className={`text-xs font-mono transition-colors ${isSelected ? 'text-white' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
                ${(p.price / 1000).toFixed(0)}K
              </span>
              <div 
                className={`w-full rounded-t transition-all duration-300 ${
                  isSelected 
                    ? 'bg-white' 
                    : 'bg-neutral-700 group-hover:bg-neutral-600'
                }`}
                style={{ height: `${heightPercent}%` }}
              />
              <span className={`text-xs transition-colors ${isSelected ? 'text-white font-medium' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
                {p.year}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============== MAIN APP ==============
export default function App() {
  const [form, setForm] = useState({
    town: "BEDOK",
    flatType: "4 ROOM",
    flatModel: "Improved",
    storey: "07 TO 09",
    floorArea: 95,
    leaseYear: 1995
  });
  
  const [selectedYear, setSelectedYear] = useState(2025);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Store predictions in state - only updates on button click
  const [predictions, setPredictions] = useState(null);
  // Store the form values that were used for prediction
  const [submittedForm, setSubmittedForm] = useState(null);
  
  // Derived from stored predictions (not from form)
  const selectedPrediction = predictions?.find(p => p.year === selectedYear);
  const basePrice = predictions?.[0]?.price;
  const priceChange = predictions && selectedYear > 2025 
    ? ((selectedPrediction.price - basePrice) / basePrice * 100).toFixed(1)
    : null;

  const handlePredict = async () => {
    setIsLoading(true);
    
    // Store the form values being submitted
    const currentForm = { ...form };
    
    // Simulate API call to backend
    await new Promise(r => setTimeout(r, 800));
    
    // In real app: const response = await fetch('/api/predict', { method: 'POST', body: JSON.stringify(form) })
    // For now, calculate locally (this would come from backend)
    const results = PREDICTION_YEARS.map(year => ({
      year,
      ...predictMarketPrice(currentForm, year)
    }));
    
    setPredictions(results);
    setSubmittedForm(currentForm);
    setShowResults(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-light tracking-tight mb-2">
                Market Price Prediction
              </h1>
              <p className="text-neutral-500 text-sm">
                Predict average resale prices for a flat segment
              </p>
            </div>
            
            <Select 
              label="Town" 
              value={form.town} 
              onChange={v => setForm({...form, town: v})} 
              options={HDB_TOWNS} 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Flat Type" 
                value={form.flatType} 
                onChange={v => setForm({...form, flatType: v})} 
                options={FLAT_TYPES} 
              />
              <Select 
                label="Flat Model" 
                value={form.flatModel} 
                onChange={v => setForm({...form, flatModel: v})} 
                options={FLAT_MODELS} 
              />
            </div>
            
            <Select 
              label="Storey Range" 
              value={form.storey} 
              onChange={v => setForm({...form, storey: v})} 
              options={STOREY_RANGES} 
            />
            
            <Slider 
              label="Floor Area" 
              value={form.floorArea} 
              onChange={v => setForm({...form, floorArea: v})} 
              min={35} 
              max={200} 
              unit=" sqm" 
            />
            
            <Slider 
              label="Lease Commence Year" 
              value={form.leaseYear} 
              onChange={v => setForm({...form, leaseYear: v})} 
              min={1966} 
              max={2024} 
            />
            
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className="w-full py-4 bg-white text-black rounded-lg font-medium
                       hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Predicting..." : "Predict Market Price"}
            </button>
          </div>

          {/* Right: Results */}
          <div>
            {!showResults ? (
              <div className="h-full min-h-[400px] flex items-center justify-center border border-dashed border-neutral-800 rounded-xl">
                <div className="text-center px-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-neutral-900 flex items-center justify-center">
                    <svg className="w-7 h-7 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-neutral-500 text-sm">
                    Configure flat criteria and predict
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Main Price Card */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs uppercase tracking-widest text-neutral-500">
                      Predicted Market Price • {selectedYear}
                    </span>
                    {priceChange && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        parseFloat(priceChange) >= 0 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}% from 2025
                      </span>
                    )}
                  </div>
                  
                  <p className="text-4xl font-mono font-light text-white mb-4">
                    ${selectedPrediction?.price.toLocaleString()}
                  </p>
                  
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="text-neutral-600">Range: </span>
                      <span className="font-mono text-neutral-400">
                        ${selectedPrediction?.lower.toLocaleString()} – ${selectedPrediction?.upper.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-neutral-800">
                    <p className="text-xs text-neutral-600">
                      Average price for <span className="text-neutral-400">{submittedForm?.flatType}</span> flats 
                      in <span className="text-neutral-400">{submittedForm?.town}</span> with 
                      ~<span className="text-neutral-400">{selectedPrediction?.remainingLease} years</span> lease 
                      remaining in <span className="text-neutral-400">{selectedYear}</span>
                    </p>
                  </div>
                </div>

                {/* Price Trajectory - Interactive: Click bars to select year */}
                {predictions && <PriceChart predictions={predictions} selectedYear={selectedYear} onSelectYear={setSelectedYear} />}

                {/* Input Summary - Show the criteria that was used for prediction */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4">
                  <p className="text-xs uppercase tracking-widest text-neutral-600 mb-3">
                    Prediction Criteria
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-mono">
                      {submittedForm?.town}
                    </span>
                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-mono">
                      {submittedForm?.flatType}
                    </span>
                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-mono">
                      {submittedForm?.flatModel}
                    </span>
                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-mono">
                      {submittedForm?.storey}
                    </span>
                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-mono">
                      {submittedForm?.floorArea} sqm
                    </span>
                    <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 font-mono">
                      Lease from {submittedForm?.leaseYear}
                    </span>
                  </div>
                </div>
                
                {/* Disclaimer */}
                <p className="text-xs text-neutral-700 text-center">
                  Predictions based on historical trends. Actual prices may vary.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 mt-10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-neutral-600">
          <span>Trained on 217K+ HDB transactions (2017–2025)</span>
          <span>Data Minions • SUTD Production Ready ML</span>
        </div>
      </footer>
    </div>
  );
}