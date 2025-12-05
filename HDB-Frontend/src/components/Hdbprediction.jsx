import React, { useState, useRef, useEffect } from 'react';

// Theme helper - generates class names based on isDark prop
const getTheme = (isDark) => ({
  bg: isDark ? 'bg-black' : 'bg-gray-50',
  bgCard: isDark ? 'bg-neutral-900' : 'bg-white',
  bgInput: isDark ? 'bg-neutral-900' : 'bg-white',
  bgSection: isDark ? 'bg-neutral-900/50' : 'bg-gray-50',
  bgTrack: isDark ? 'bg-neutral-800' : 'bg-gray-200',
  bgFill: isDark ? 'bg-white' : 'bg-gray-900',
  bgHandle: isDark ? 'bg-white' : 'bg-gray-900',
  bgHover: isDark ? 'bg-neutral-800' : 'bg-gray-100',
  bgTooltip: isDark ? 'bg-neutral-800' : 'bg-gray-100',
  bgEmpty: isDark ? 'bg-neutral-900' : 'bg-gray-100',
  text: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-neutral-400' : 'text-gray-600',
  textMuted: isDark ? 'text-neutral-500' : 'text-gray-500',
  textLabel: isDark ? 'text-neutral-500' : 'text-gray-500',
  border: isDark ? 'border-neutral-800' : 'border-gray-200',
  borderInput: isDark ? 'border-neutral-800' : 'border-gray-300',
  borderHover: isDark ? 'border-neutral-700' : 'border-gray-400',
  borderFocus: isDark ? 'border-neutral-600' : 'border-gray-400',
  borderDashed: isDark ? 'border-neutral-800' : 'border-gray-300',
  btnPrimary: isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-gray-900 text-white hover:bg-gray-800',
  tagBg: isDark ? 'bg-neutral-800' : 'bg-white border border-gray-200',
  tagText: isDark ? 'text-neutral-400' : 'text-gray-700',
  barSelected: isDark ? 'bg-white' : 'bg-gray-900',
  barUnselected: isDark ? 'bg-neutral-700' : 'bg-gray-300',
  barHover: isDark ? 'group-hover:bg-neutral-600' : 'group-hover:bg-gray-400',
  success: isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600',
  error: isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600',
});

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
const Select = ({ label, value, onChange, options, isDark = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const t = getTheme(isDark);
  
  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);
  
  // Highlight matching text
  const highlightMatch = (text) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-gray-900">{part}</mark> : part
    );
  };

  return (
    <div className="space-y-2">
      <label className={`block text-xs uppercase tracking-widest ${t.textLabel}`}>
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full ${t.bgInput} border rounded-lg px-4 py-3 ${t.text} text-sm text-left flex items-center justify-between transition-all duration-300 ${
            isOpen ? t.borderFocus : `${t.borderInput} hover:${t.borderHover}`
          }`}
        >
          <span>{value}</span>
          <svg className={`w-4 h-4 ${t.textMuted} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className={`absolute z-50 w-full mt-1 ${t.bgCard} border ${t.border} rounded-lg shadow-xl overflow-hidden`}>
            {/* Search input */}
            <div className={`p-2 border-b ${t.border}`}>
              <div className="relative">
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`w-full pl-9 pr-3 py-2 text-sm ${t.bgInput} border ${t.borderInput} ${t.text} rounded-md focus:outline-none focus:${t.borderFocus}`}
                />
              </div>
            </div>
            
            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className={`px-4 py-3 text-sm ${t.textMuted} text-center`}>No results found</div>
              ) : (
                filteredOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { 
                      onChange(opt); 
                      setIsOpen(false); 
                      setSearchQuery('');
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      value === opt 
                        ? `${t.bgSection} ${t.text} font-medium` 
                        : `${t.textSecondary} hover:${t.bgHover}`
                    }`}
                  >
                    {highlightMatch(opt)}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Slider = ({ label, value, onChange, min, max, step = 1, unit = "", isDark = false }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const t = getTheme(isDark);
  
  const percent = ((value - min) / (max - min)) * 100;
  
  // Format value to avoid floating point display issues
  const formatVal = (v) => {
    const decimals = step < 1 ? String(step).split('.')[1]?.length || 1 : 0;
    return Number(v).toFixed(decimals);
  };
  
  const handleMove = (clientX) => {
    if (!trackRef.current) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const rawValue = (pct / 100) * (max - min) + min;
    const snappedValue = Math.round(rawValue / step) * step;
    // Fix floating point by rounding to step precision
    const decimals = step < 1 ? String(step).split('.')[1]?.length || 1 : 0;
    const fixedValue = Number(snappedValue.toFixed(decimals));
    onChange(Math.max(min, Math.min(max, fixedValue)));
  };
  
  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  const showValue = isHovering || isDragging;
  
  return (
    <div 
      className="space-y-2"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        if (!isDragging) setIsHovering(false);
      }}
    >
      <label className={`block text-xs uppercase tracking-widest ${t.textLabel}`}>{label}</label>
      
      {/* Value display that moves with handle */}
      <div className="relative h-6">
        <div 
          className={`absolute -translate-x-1/2 transition-all duration-150 ease-out ${
            showValue ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ left: `${percent}%` }}
        >
          <span className={`px-2 py-1 ${t.bgTooltip} ${t.text} text-xs font-mono rounded-md whitespace-nowrap`}>
            {formatVal(value)}{unit}
          </span>
        </div>
      </div>
      
      <div className="relative py-2">
        {/* Invisible larger hit area for easier interaction */}
        <div 
          ref={trackRef}
          className="absolute inset-0 cursor-pointer"
          style={{ top: '-8px', bottom: '-8px', height: 'calc(100% + 16px)' }}
          onClick={(e) => handleMove(e.clientX)}
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
            handleMove(e.clientX);
          }}
        />
        
        {/* Visible thin track */}
        <div className={`relative h-1 ${t.bgTrack} rounded-full pointer-events-none`}>
          {/* Fill */}
          <div 
            className={`absolute h-full ${t.bgFill} rounded-full transition-all duration-150 ease-out`}
            style={{ width: `${percent}%` }}
          />
        </div>
        
        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out"
          style={{ left: `${percent}%` }}
        >
          {/* Invisible larger hit area for handle */}
          <div 
            className="absolute -inset-3 cursor-grab"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
          />
          
          {/* Handle circle - small and only visible on hover */}
          <div
            className={`w-3 h-3 ${t.bgHandle} rounded-full shadow-md pointer-events-none transition-all duration-200 ease-out ${
              isDragging 
                ? 'opacity-100 scale-110' 
                : showValue
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
            }`}
          />
        </div>
      </div>
      
      {/* Min/Max labels */}
      <div className={`flex justify-between text-xs ${t.textMuted}`}>
        <span>{formatVal(min)}{unit}</span>
        <span>{formatVal(max)}{unit}</span>
      </div>
    </div>
  );
};

const PriceChart = ({ predictions, selectedYear, onSelectYear, isDark = false }) => {
  const t = getTheme(isDark);
  const prices = predictions.map(p => p.price);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice || 1;
  
  return (
    <div className={`${t.bgSection} border ${t.border} rounded-xl p-5 transition-colors duration-300`}>
      <div className="flex justify-between items-center mb-4">
        <span className={`text-xs uppercase tracking-widest ${t.textMuted}`}>
          Price Trajectory
        </span>
        <span className={`text-xs ${t.textMuted}`}>Click to select year</span>
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
              <span className={`text-xs font-mono transition-colors ${isSelected ? t.text : `${t.textMuted} group-hover:${t.textSecondary}`}`}>
                ${(p.price / 1000).toFixed(0)}K
              </span>
              <div 
                className={`w-full rounded-t transition-all duration-300 ${
                  isSelected 
                    ? t.barSelected 
                    : `${t.barUnselected} ${t.barHover}`
                }`}
                style={{ height: `${heightPercent}%` }}
              />
              <span className={`text-xs transition-colors ${isSelected ? `${t.text} font-medium` : `${t.textMuted} group-hover:${t.textSecondary}`}`}>
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
export default function HDBPrediction({ isDark = false }) {
  const t = getTheme(isDark);
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
    <div className={`${t.text} transition-colors duration-300`}>
      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* Left: Form */}
          <div className="space-y-6">
            <div className="mb-8">
              <h1 className={`text-3xl font-light tracking-tight mb-2 ${t.text}`}>
                Market Price Prediction
              </h1>
              <p className={`${t.textMuted} text-sm`}>
                Predict average resale prices for a flat segment
              </p>
            </div>
            
            <Select 
              label="Town" 
              value={form.town} 
              onChange={v => setForm({...form, town: v})} 
              options={HDB_TOWNS}
              isDark={isDark}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Flat Type" 
                value={form.flatType} 
                onChange={v => setForm({...form, flatType: v})} 
                options={FLAT_TYPES}
                isDark={isDark}
              />
              <Select 
                label="Flat Model" 
                value={form.flatModel} 
                onChange={v => setForm({...form, flatModel: v})} 
                options={FLAT_MODELS}
                isDark={isDark}
              />
            </div>
            
            <Select 
              label="Storey Range" 
              value={form.storey} 
              onChange={v => setForm({...form, storey: v})} 
              options={STOREY_RANGES}
              isDark={isDark}
            />
            
            <Slider 
              label="Floor Area" 
              value={form.floorArea} 
              onChange={v => setForm({...form, floorArea: v})} 
              min={35} 
              max={200} 
              unit=" sqm"
              isDark={isDark}
            />
            
            <Slider 
              label="Lease Commence Year" 
              value={form.leaseYear} 
              onChange={v => setForm({...form, leaseYear: v})} 
              min={1966} 
              max={2024}
              isDark={isDark}
            />
            
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className={`w-full py-4 ${t.btnPrimary} rounded-lg font-medium transition-colors duration-300 disabled:opacity-50`}
            >
              {isLoading ? "Predicting..." : "Predict Market Price"}
            </button>
          </div>

          {/* Right: Results */}
          <div>
            {!showResults ? (
              <div className={`h-full min-h-[400px] flex items-center justify-center border border-dashed ${t.borderDashed} rounded-xl transition-colors duration-300`}>
                <div className="text-center px-6">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${t.bgEmpty} flex items-center justify-center transition-colors duration-300`}>
                    <svg className={`w-7 h-7 ${t.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className={`${t.textMuted} text-sm`}>
                    Configure flat criteria and predict
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Main Price Card */}
                <div className={`${t.bgCard} border ${t.border} rounded-xl p-6 ${isDark ? '' : 'shadow-sm'} transition-colors duration-300`}>
                  <div className="flex items-start justify-between mb-1">
                    <span className={`text-xs uppercase tracking-widest ${t.textMuted}`}>
                      Predicted Market Price • {selectedYear}
                    </span>
                    {priceChange && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        parseFloat(priceChange) >= 0 ? t.success : t.error
                      }`}>
                        {parseFloat(priceChange) >= 0 ? '+' : ''}{priceChange}% from 2025
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-4xl font-mono font-light ${t.text} mb-4`}>
                    ${selectedPrediction?.price.toLocaleString()}
                  </p>
                  
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className={t.textMuted}>Range: </span>
                      <span className={`font-mono ${t.textSecondary}`}>
                        ${selectedPrediction?.lower.toLocaleString()} – ${selectedPrediction?.upper.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`mt-4 pt-4 border-t ${t.border}`}>
                    <p className={`text-xs ${t.textMuted}`}>
                      Average price for <span className={t.textSecondary}>{submittedForm?.flatType}</span> flats 
                      in <span className={t.textSecondary}>{submittedForm?.town}</span> with 
                      ~<span className={t.textSecondary}>{selectedPrediction?.remainingLease} years</span> lease 
                      remaining in <span className={t.textSecondary}>{selectedYear}</span>
                    </p>
                  </div>
                </div>

                {/* Price Trajectory - Interactive: Click bars to select year */}
                {predictions && <PriceChart predictions={predictions} selectedYear={selectedYear} onSelectYear={setSelectedYear} isDark={isDark} />}

                {/* Input Summary - Show the criteria that was used for prediction */}
                <div className={`${t.bgSection} border ${t.border} rounded-xl p-4 transition-colors duration-300`}>
                  <p className={`text-xs uppercase tracking-widest ${t.textMuted} mb-3`}>
                    Used Prediction Criteria
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} font-mono`}>
                      {submittedForm?.town}
                    </span>
                    <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} font-mono`}>
                      {submittedForm?.flatType}
                    </span>
                    <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} font-mono`}>
                      {submittedForm?.flatModel}
                    </span>
                    <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} font-mono`}>
                      {submittedForm?.storey}
                    </span>
                    <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} font-mono`}>
                      {submittedForm?.floorArea} sqm
                    </span>
                    <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} font-mono`}>
                      Lease from {submittedForm?.leaseYear}
                    </span>
                  </div>
                </div>
                
                {/* Disclaimer */}
                <p className={`text-xs ${t.textMuted} text-center`}>
                  Predictions based on historical trends. Actual prices may vary.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${t.border} mt-10 transition-colors duration-300`}>
        <div className={`max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs ${t.textMuted}`}>
          <span>Trained on 217K+ HDB transactions (2017–2025)</span>
          <span>Data Minions • SUTD Production Ready ML</span>
        </div>
      </footer>
    </div>
  );
}