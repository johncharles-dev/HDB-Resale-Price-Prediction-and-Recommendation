import React, { useState, useRef, useEffect } from 'react';

// ============== API CONFIG ==============
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

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
  "Apartment", "DBSS", "Improved", "Maisonette", "Model A", 
  "Model A2", "New Generation", "OTHER", "Premium Apartment", 
  "Simplified", "Standard"
];

const STOREY_RANGES = [
  "01 TO 03", "04 TO 06", "07 TO 09", "10 TO 12", "13 TO 15",
  "16 TO 18", "19 TO 21", "22 TO 24", "25 TO 27", "28 TO 30",
  "31 TO 33", "34 TO 36", "37 TO 39", "40 TO 42", "43 TO 45"
];

const PREDICTION_YEARS = [2025, 2026, 2027, 2028, 2029];

// ============== TOWN DETECTION FROM ADDRESS ==============
const detectTownFromAddress = (address) => {
  const addressUpper = address.toUpperCase();
  
  // Map of keywords to towns
  const townKeywords = {
    'ANG MO KIO': ['ANG MO KIO', 'AMK'],
    'BEDOK': ['BEDOK'],
    'BISHAN': ['BISHAN'],
    'BUKIT BATOK': ['BUKIT BATOK', 'BT BATOK'],
    'BUKIT MERAH': ['BUKIT MERAH', 'BT MERAH', 'DEPOT', 'TELOK BLANGAH', 'REDHILL', 'TIONG BAHRU'],
    'BUKIT PANJANG': ['BUKIT PANJANG', 'BT PANJANG'],
    'BUKIT TIMAH': ['BUKIT TIMAH', 'BT TIMAH'],
    'CENTRAL AREA': ['CENTRAL', 'TANJONG PAGAR', 'CHINATOWN', 'OUTRAM'],
    'CHOA CHU KANG': ['CHOA CHU KANG', 'CCK'],
    'CLEMENTI': ['CLEMENTI'],
    'GEYLANG': ['GEYLANG', 'ALJUNIED', 'MACPHERSON'],
    'HOUGANG': ['HOUGANG'],
    'JURONG EAST': ['JURONG EAST'],
    'JURONG WEST': ['JURONG WEST'],
    'KALLANG/WHAMPOA': ['KALLANG', 'WHAMPOA', 'BOON KENG', 'BENDEMEER'],
    'MARINE PARADE': ['MARINE PARADE', 'MARINE CRS', 'MARINE DR'],
    'PASIR RIS': ['PASIR RIS'],
    'PUNGGOL': ['PUNGGOL'],
    'QUEENSTOWN': ['QUEENSTOWN', 'COMMONWEALTH', 'TANGLIN HALT', 'GHIM MOH'],
    'SEMBAWANG': ['SEMBAWANG'],
    'SENGKANG': ['SENGKANG'],
    'SERANGOON': ['SERANGOON'],
    'TAMPINES': ['TAMPINES'],
    'TOA PAYOH': ['TOA PAYOH'],
    'WOODLANDS': ['WOODLANDS'],
    'YISHUN': ['YISHUN']
  };
  
  for (const [town, keywords] of Object.entries(townKeywords)) {
    for (const keyword of keywords) {
      if (addressUpper.includes(keyword)) {
        return town;
      }
    }
  }
  
  return null; // No match found
};

// ============== ADDRESS SEARCH COMPONENT ==============
const AddressSearch = ({ label, value, onChange, onSelect, isDark = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);
  const t = getTheme(isDark);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Search OneMap API
  const searchOneMap = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // OneMap API
      const response = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`
      );
      const data = await response.json();

      if (data.found > 0) {
        // Filter for HDB addresses (typically have BLK or block numbers)
        const hdbResults = data.results
          .filter(r => r.ADDRESS && (r.ADDRESS.includes('BLK') || /^\d+[A-Z]?\s/.test(r.ADDRESS)))
          .slice(0, 8)
          .map(r => ({
            address: r.ADDRESS,
            block: r.BLK_NO || extractBlock(r.ADDRESS),
            street: r.ROAD_NAME || extractStreet(r.ADDRESS),
            latitude: parseFloat(r.LATITUDE),
            longitude: parseFloat(r.LONGITUDE),
            postal: r.POSTAL,
            source: 'onemap'
          }));

        if (hdbResults.length > 0) {
          setSuggestions(hdbResults);
          setIsLoading(false);
          return;
        }
      }

      // Fallback to OpenStreetMap Nominatim
      await searchOpenStreetMap(query);
    } catch (error) {
      console.error('OneMap search error:', error);
      // Fallback to OpenStreetMap
      await searchOpenStreetMap(query);
    }
  };

  // Fallback: OpenStreetMap Nominatim
  const searchOpenStreetMap = async (query) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Singapore')}&format=json&addressdetails=1&limit=5`
      );
      const data = await response.json();

      const results = data
        .filter(r => r.address)
        .map(r => ({
          address: r.display_name.split(',').slice(0, 3).join(', '),
          block: r.address.house_number || '',
          street: r.address.road || r.address.suburb || '',
          latitude: parseFloat(r.lat),
          longitude: parseFloat(r.lon),
          postal: r.address.postcode || '',
          source: 'openstreetmap'
        }));

      setSuggestions(results);
    } catch (error) {
      console.error('OpenStreetMap search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract block from address string
  const extractBlock = (address) => {
    const match = address.match(/^(\d+[A-Z]?)\s/);
    return match ? match[1] : '';
  };

  // Extract street from address string
  const extractStreet = (address) => {
    const parts = address.split(' ');
    if (parts.length > 1) {
      // Remove block number and postal code
      return parts.slice(1).filter(p => !/^\d{6}$/.test(p)).join(' ');
    }
    return address;
  };

  // Debounced search
  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onChange(query);
    setIsOpen(true);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce API call
    debounceRef.current = setTimeout(() => {
      searchOneMap(query);
    }, 300);
  };

  // Handle selection
  const handleSelect = (suggestion) => {
    setSearchQuery(suggestion.address);
    setSelectedAddress(suggestion);
    onChange(suggestion.address);
    onSelect(suggestion);
    setIsOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-2">
      <label className={`block text-xs uppercase tracking-widest ${t.textLabel}`}>
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder="Type block & street (e.g., 112A Depot Road)"
            className={`w-full ${t.bgInput} border rounded-lg px-4 py-3 pr-10 ${t.text} text-sm transition-all duration-300 ${
              isOpen ? t.borderFocus : `${t.borderInput} hover:${t.borderHover}`
            }`}
          />
          {/* Search/Loading Icon */}
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted}`}>
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && suggestions.length > 0 && (
          <div className={`absolute z-50 w-full mt-1 ${t.bgCard} border ${t.border} rounded-lg shadow-xl max-h-60 overflow-y-auto`}>
            {suggestions.map((suggestion, index) => {
              const detectedTown = detectTownFromAddress(suggestion.address);
              return (
                <button
                  key={index}
                  onClick={() => handleSelect(suggestion)}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors hover:${t.bgHover} border-b ${t.border} last:border-b-0`}
                >
                  <div className={`font-medium ${t.text}`}>{suggestion.address}</div>
                  <div className={`text-xs ${t.textMuted} mt-0.5 flex items-center gap-2`}>
                    <span>Block: {suggestion.block || 'N/A'}</span>
                    <span>•</span>
                    <span>Street: {suggestion.street || 'N/A'}</span>
                    {detectedTown && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-500">Town: {detectedTown}</span>
                      </>
                    )}
                    {suggestion.source === 'openstreetmap' && (
                      <>
                        <span>•</span>
                        <span className="text-yellow-500">via OpenStreetMap</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* No results message */}
        {isOpen && searchQuery.length >= 2 && !isLoading && suggestions.length === 0 && (
          <div className={`absolute z-50 w-full mt-1 ${t.bgCard} border ${t.border} rounded-lg shadow-xl p-4`}>
            <p className={`text-sm ${t.textMuted}`}>No addresses found. Try a different search.</p>
          </div>
        )}

        {/* Selected address confirmation */}
        {selectedAddress && !isOpen && (
          <div className={`mt-2 p-2 rounded-lg ${t.bgSection} border ${t.border}`}>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className={`text-xs ${t.textSecondary}`}>
                📍 Lat: {selectedAddress.latitude?.toFixed(4)}, Lng: {selectedAddress.longitude?.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============== OTHER COMPONENTS ==============
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
          <div className={`absolute z-50 w-full mt-1 ${t.bgCard} border ${t.border} rounded-lg shadow-xl max-h-60 overflow-hidden`}>
            {/* Search Input */}
            <div className={`p-2 border-b ${t.border}`}>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className={`w-full px-3 py-2 ${t.bgInput} border ${t.borderInput} rounded-md text-sm ${t.text} focus:outline-none focus:${t.borderFocus}`}
              />
            </div>
            
            {/* Options List */}
            <div className="overflow-y-auto max-h-44">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { onChange(opt); setIsOpen(false); setSearchQuery(''); }}
                    className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                      value === opt 
                        ? `${t.bgHover} ${t.text} font-medium` 
                        : `${t.text} hover:${t.bgHover}`
                    }`}
                  >
                    {highlightMatch(opt)}
                  </button>
                ))
              ) : (
                <div className={`px-4 py-3 text-sm ${t.textMuted}`}>
                  No results found
                </div>
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
      <div className={`flex justify-between text-xs ${t.textSecondary}`}>
        <span>{formatVal(min)}{unit}</span>
        <span>{formatVal(max)}{unit}</span>
      </div>
    </div>
  );
};

const PriceChart = ({ predictions, selectedYear, onSelectYear, isDark = false }) => {
  const t = getTheme(isDark);
  const maxPrice = Math.max(...predictions.map(p => p.price));
  
  return (
    <div className={`${t.bgCard} border ${t.border} rounded-xl p-5 ${isDark ? '' : 'shadow-sm'} transition-colors duration-300`}>
      <p className={`text-xs uppercase tracking-widest ${t.textMuted} mb-4`}>
        Price Trajectory • Click to Select Year
      </p>
      <div className="flex items-end justify-between gap-3 h-32">
        {predictions.map(pred => {
          const isSelected = pred.year === selectedYear;
          const barHeight = (pred.price / maxPrice) * 100;
          
          return (
            <button
              key={pred.year}
              onClick={() => onSelectYear(pred.year)}
              className={`group flex-1 flex flex-col items-center gap-2 transition-all duration-200 ${
                isSelected ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              {/* Price label on hover/select */}
              <span className={`text-xs font-mono transition-opacity duration-200 ${
                isSelected ? `${t.text} opacity-100` : `${t.textMuted} opacity-0 group-hover:opacity-100`
              }`}>
                ${pred.price.toLocaleString()}
              </span>
              
              {/* Bar */}
              <div 
                className={`w-full rounded-t-md transition-all duration-300 ${
                  isSelected 
                    ? `${t.barSelected} ring-2 ring-offset-2 ${isDark ? 'ring-white ring-offset-neutral-900' : 'ring-gray-900 ring-offset-white'}` 
                    : `${t.barUnselected} ${t.barHover}`
                }`}
                style={{ height: `${barHeight}%`, minHeight: '20px' }}
              ></div>
              
              {/* Year label */}
              <span className={`text-xs ${isSelected ? t.text : t.textMuted} font-medium`}>
                {pred.year}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============== MAIN COMPONENT ==============
export default function HDBPrediction({ isDark = false }) {
  const t = getTheme(isDark);
  
  // Form state - Updated for Try 2
  const [form, setForm] = useState({
    address: '',
    block: '',
    street: '',
    latitude: null,
    longitude: null,
    town: HDB_TOWNS[0],
    flatType: FLAT_TYPES[2],
    flatModel: FLAT_MODELS[2],
    storey: STOREY_RANGES[3],
    floorArea: 90,
    leaseYear: 2000
  });

  // Prediction states
  const [predictions, setPredictions] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [submittedForm, setSubmittedForm] = useState(null);
  
  // NEW: Toggle state for showing breakdown
  const [showBreakdown, setShowBreakdown] = useState(false);

  // Handle address selection
  const handleAddressSelect = (suggestion) => {
    // Auto-detect town from address
    const detectedTown = detectTownFromAddress(suggestion.address);
    
    setForm(prev => ({
      ...prev,
      address: suggestion.address,
      block: suggestion.block,
      street: suggestion.street,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      // Auto-update town if detected
      ...(detectedTown && { town: detectedTown })
    }));
  };

  // Extract floor level from storey range (e.g., "10 TO 12" -> 10)
  const getFloorLevel = (storey) => {
    const match = storey.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  // Handle prediction
  const handlePredict = async () => {
    // Validate address is selected
    if (!form.latitude || !form.longitude) {
      setError('Please select a valid address from the dropdown');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const currentMonth = new Date().getMonth() + 1;
      
      // Single API call with all years
      const requestBody = {
        block: form.block,
        street: form.street,
        town: form.town,
        flat_type: form.flatType,
        flat_model: form.flatModel,
        floor_area_sqm: form.floorArea,
        lease_commence_year: form.leaseYear,
        floor_level: getFloorLevel(form.storey),
        years: PREDICTION_YEARS,  // [2025, 2026, 2027, 2028, 2029]
        month: currentMonth,
        latitude: form.latitude,
        longitude: form.longitude
      };

      const response = await fetch(`${API_URL}/predict/multi-year`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || 'Prediction failed');
      }

      if (data.success === false) {
        throw new Error(data.error || 'Prediction failed');
      }
      
      // Transform response - UPDATED FOR HYBRID MODEL
      const allPredictions = data.predictions.map(p => ({
        year: p.year,
        price: Math.round(p.predicted_price),
        lower: Math.round(p.predicted_price * 0.95),
        upper: Math.round(p.predicted_price * 1.05),
        remainingLease: p.remaining_lease,
        // NEW: Hybrid model data
        basePrice: p.base_price ? Math.round(p.base_price) : null,
        trendMultiplier: p.trend_multiplier || null
      }));

      setPredictions(allPredictions);
      setSelectedYear(2025);
      setSubmittedForm({...form});
      setShowResults(true);
      
    } catch (err) {
      console.error('Prediction error:', err);
      let errorMessage = 'Failed to get prediction. Please try again.';
      if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err.detail) {
        errorMessage = err.detail;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get selected prediction data
  const selectedPrediction = predictions?.find(p => p.year === selectedYear);
  
  // Calculate price change from base year
  const priceChange = predictions && selectedYear !== 2025
    ? (((selectedPrediction?.price - predictions[0].price) / predictions[0].price) * 100).toFixed(1)
    : null;

  return (
    <div className={`min-h-screen ${t.bg} transition-colors duration-300`}>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left: Input Form */}
          <div className="space-y-5">
            <div>
              <h1 className={`text-2xl font-semibold ${t.text} mb-1`}>
                HDB Price Prediction
              </h1>
              <p className={`${t.textMuted} text-sm`}>
                Get accurate price predictions based on specific HDB address
              </p>
            </div>

            {/* NEW: Address Search */}
            <AddressSearch
              label="Block & Street Address"
              value={form.address}
              onChange={(v) => setForm({...form, address: v})}
              onSelect={handleAddressSelect}
              isDark={isDark}
            />
            
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
              step={1}
              unit=" sqm"
              isDark={isDark}
            />
            
            <Slider 
              label="Lease Commence Year" 
              value={form.leaseYear} 
              onChange={v => setForm({...form, leaseYear: v})} 
              min={1966} 
              max={2024}
              step={1}
              isDark={isDark}
            />
            
            <button
              onClick={handlePredict}
              disabled={isLoading}
              className={`w-full py-4 ${t.btnPrimary} rounded-lg font-medium transition-colors duration-300 disabled:opacity-50`}
            >
              {isLoading ? "Predicting..." : "Predict Market Price"}
            </button>
            
            {/* Error Message */}
            {error && (
              <div className={`p-3 rounded-lg ${t.error} text-sm`}>
                {error}
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div>
            {!showResults ? (
              <div className={`h-full min-h-[400px] flex items-center justify-center border border-dashed ${t.borderDashed} rounded-xl transition-colors duration-300`}>
                <div className="text-center px-6">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${t.bgEmpty} flex items-center justify-center transition-colors duration-300`}>
                    <svg className={`w-7 h-7 ${t.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className={`${t.textMuted} text-sm`}>
                    Search for an HDB address to get price predictions
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* Main Price Card - UPDATED WITH TOGGLE */}
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
                  
                  {/* UPDATED: Toggle section with breakdown */}
                  <div className={`mt-4 pt-4 border-t ${t.border}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${t.textMuted}`}>
                        Price for <span className={t.textSecondary}>{submittedForm?.flatType}</span> at 
                        <span className={t.textSecondary}> {submittedForm?.block} {submittedForm?.street}</span> with 
                        ~<span className={t.textSecondary}>{selectedPrediction?.remainingLease} years</span> lease 
                        remaining in <span className={t.textSecondary}>{selectedYear}</span>
                      </p>
                      
                      {/* Toggle Button */}
                      {selectedPrediction?.basePrice && (
                        <button
                          onClick={() => setShowBreakdown(!showBreakdown)}
                          className={`ml-4 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 flex-shrink-0 ${
                            showBreakdown
                              ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                              : (isDark ? 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
                          }`}
                        >
                          {showBreakdown ? '▲ Hide' : '▼ Show'} Breakdown
                        </button>
                      )}
                    </div>
                    
                    {/* Price Breakdown Panel */}
                    {showBreakdown && selectedPrediction?.basePrice && (
                      <div className={`mt-4 p-4 rounded-lg ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'} transition-all duration-300`}>
                        <div className="space-y-3">
                          {/* Base Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                              <span className={`text-sm ${t.textSecondary}`}>Base Price (XGBoost)</span>
                            </div>
                            <span className={`font-mono text-sm ${t.text}`}>
                              ${selectedPrediction.basePrice.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Trend Multiplier */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}></div>
                              <span className={`text-sm ${t.textSecondary}`}>Market Trend (Prophet)</span>
                            </div>
                            <span className={`font-mono text-sm ${t.text}`}>
                              ×{selectedPrediction.trendMultiplier?.toFixed(4)}
                            </span>
                          </div>
                          
                          {/* Divider */}
                          <div className={`border-t ${t.border}`}></div>
                          
                          {/* Final Price */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-gray-900'}`}></div>
                              <span className={`text-sm font-medium ${t.text}`}>Final Price</span>
                            </div>
                            <span className={`font-mono text-sm font-medium ${t.text}`}>
                              ${selectedPrediction.price.toLocaleString()}
                            </span>
                          </div>
                          
                          {/* Formula */}
                          <div className={`mt-2 p-2 rounded ${isDark ? 'bg-neutral-900' : 'bg-white border'} text-center`}>
                            <code className={`text-xs ${t.textMuted}`}>
                              ${selectedPrediction.basePrice.toLocaleString()} × {selectedPrediction.trendMultiplier?.toFixed(4)} = ${selectedPrediction.price.toLocaleString()}
                            </code>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Trajectory */}
                {predictions && <PriceChart predictions={predictions} selectedYear={selectedYear} onSelectYear={setSelectedYear} isDark={isDark} />}

                {/* Input Summary */}
                <div className={`${t.bgSection} border ${t.border} rounded-xl p-4 transition-colors duration-300`}>
                  <p className={`text-xs uppercase tracking-widest ${t.textMuted} mb-3`}>
                    Prediction Details
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} font-mono`}>
                      📍 {submittedForm?.block} {submittedForm?.street}
                    </span>
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
                
                {/* UPDATED Disclaimer */}
                <p className={`text-xs ${t.textMuted} text-center`}>
                  Predictions powered by <strong>Hybrid Model</strong>: XGBoost (property valuation) × Prophet (market trend)
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${t.border} mt-10 transition-colors duration-300`}>
        <div className={`max-w-5xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs ${t.textMuted}`}>
          <span>Trained on 254K+ HDB transactions (2015–2025)</span>
          <span>Data Minions • SUTD Production Ready ML</span>
        </div>
      </footer>
    </div>
  );
}