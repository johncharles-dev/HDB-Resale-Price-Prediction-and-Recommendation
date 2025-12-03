import React, { useState, useRef, useEffect } from 'react';

// ============== DATA CONFIG ==============
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
  "Premium Apartment", "Maisonette", "Apartment", "DBSS", "Model A2"
];

const STOREY_RANGES = [
  "01 TO 03", "04 TO 06", "07 TO 09", "10 TO 12", "13 TO 15",
  "16 TO 18", "19 TO 21", "22 TO 24", "25 TO 27", "28 TO 30",
  "31 TO 33", "34 TO 36", "37 TO 39", "40 TO 42"
];

const WORK_LOCATIONS = [
  "CBD (Raffles Place)", "Marina Bay", "Shenton Way", "Tanjong Pagar",
  "Jurong East", "Jurong Island", "Changi Business Park", "Paya Lebar",
  "Woodlands", "Tampines", "One North", "Buona Vista", "Novena"
];

// Sample data - in real app, load from your datasets
const SCHOOLS_SAMPLE = [
  "Raffles Institution", "Hwa Chong Institution", "Anglo-Chinese School",
  "Nanyang Girls High", "Methodist Girls School", "St Joseph Institution",
  "Victoria School", "Cedar Girls Secondary", "Dunman High School",
  "National Junior College", "River Valley High", "CHIJ St Nicholas"
];

const MALLS_SAMPLE = [
  "Tampines Mall", "Junction 8", "Nex", "Bedok Mall", "Lot One",
  "Jurong Point", "Causeway Point", "Northpoint City", "Compass One",
  "Waterway Point", "Jewel Changi", "VivoCity", "ION Orchard"
];

const HAWKER_SAMPLE = [
  "Old Airport Road Food Centre", "Maxwell Food Centre", "Tiong Bahru Market",
  "Amoy Street Food Centre", "Chomp Chomp", "Newton Food Centre",
  "Lau Pa Sat", "Adam Road Food Centre", "Ghim Moh Market", "Bedok Food Centre"
];

const GYM_SAMPLE = [
  "ActiveSG Gym", "Anytime Fitness", "Fitness First", "Pure Fitness",
  "Celebrity Fitness", "True Fitness", "Gymmboxx", "The Gym Pod"
];

const PREDICTION_YEARS = [2025, 2026, 2027, 2028];

// ============== MOCK RECOMMENDATION ==============
const generateRecommendations = (criteria) => {
  const towns = criteria.towns.length > 0 ? criteria.towns : ["BEDOK", "TAMPINES", "PASIR RIS"];
  
  return towns.slice(0, 5).map((town, i) => {
    const basePrice = 450000 + Math.random() * 200000;
    const yearMult = Math.pow(1.035, criteria.targetYear - 2025);
    const price = Math.round(basePrice * yearMult / 1000) * 1000;
    
    return {
      id: i + 1,
      town,
      flatType: criteria.flatTypes[0] || "4 ROOM",
      flatModel: criteria.flatModels[0] || "Improved",
      predictedPrice: price,
      priceRange: { low: Math.round(price * 0.94 / 1000) * 1000, high: Math.round(price * 1.06 / 1000) * 1000 },
      floorArea: { min: 85, max: 105 },
      storeyRange: "07 TO 15",
      remainingLease: 65 + Math.floor(Math.random() * 20),
      distances: {
        mrt: (Math.random() * 0.8 + 0.2).toFixed(1),
        school: (Math.random() * 0.6 + 0.2).toFixed(1),
        mall: (Math.random() * 1.0 + 0.3).toFixed(1),
        hawker: (Math.random() * 0.5 + 0.2).toFixed(1)
      },
      matchScore: Math.round(95 - i * 5 + Math.random() * 4)
    };
  });
};

// ============== COMPONENTS ==============

// Multi-select Chips
const ChipSelect = ({ label, options, selected, onChange, maxShow = 8 }) => {
  const [showAll, setShowAll] = useState(false);
  const displayOptions = showAll ? options : options.slice(0, maxShow);
  
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  
  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-widest text-neutral-500">{label}</label>
      <div className="flex flex-wrap gap-2">
        {displayOptions.map(opt => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ease-out transform active:scale-95 ${
              selected.includes(opt)
                ? 'bg-white text-black shadow-lg shadow-white/10'
                : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'
            }`}
          >
            {opt}
          </button>
        ))}
        {options.length > maxShow && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-3 py-1.5 text-sm text-neutral-500 hover:text-white transition-colors duration-200"
          >
            {showAll ? '− Show less' : `+ ${options.length - maxShow} more`}
          </button>
        )}
      </div>
      <div className={`text-xs text-neutral-600 transition-all duration-200 ${selected.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
        {selected.length} selected
      </div>
    </div>
  );
};

// Range Slider with dual handles on single track
const RangeSlider = ({ label, min, max, values, onChange, unit = "", step = 1, formatValue }) => {
  // Format value to avoid floating point display issues
  const formatNum = (v) => {
    const decimals = step < 1 ? String(step).split('.')[1]?.length || 1 : 0;
    return Number(v).toFixed(decimals);
  };
  const format = formatValue || ((v) => `${formatNum(v)}${unit}`);
  
  const [hoverHandle, setHoverHandle] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [isTrackHovered, setIsTrackHovered] = useState(false);
  const trackRef = useRef(null);
  
  // Calculate percentages for positioning
  const minPercent = ((values[0] - min) / (max - min)) * 100;
  const maxPercent = ((values[1] - min) / (max - min)) * 100;
  
  // Handle mouse/touch movement
  const handleMove = (clientX) => {
    if (!trackRef.current || dragging === null) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const rawValue = (percent / 100) * (max - min) + min;
    const snappedValue = Math.round(rawValue / step) * step;
    // Fix floating point by rounding to step precision
    const decimals = step < 1 ? String(step).split('.')[1]?.length || 1 : 0;
    const fixedValue = Number(snappedValue.toFixed(decimals));
    
    if (dragging === 'min') {
      const newMin = Math.min(fixedValue, values[1] - step);
      onChange([Math.max(min, Number(newMin.toFixed(decimals))), values[1]]);
    } else {
      const newMax = Math.max(fixedValue, values[0] + step);
      onChange([values[0], Math.min(max, Number(newMax.toFixed(decimals)))]);
    }
  };
  
  // Mouse events
  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleMouseUp = () => setDragging(null);
    
    if (dragging !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, values]);
  
  // Touch events
  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };
  
  const handleTrackClick = (e) => {
    const rect = trackRef.current.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const clickValue = (percent / 100) * (max - min) + min;
    const decimals = step < 1 ? String(step).split('.')[1]?.length || 1 : 0;
    
    // Move closest handle
    const distToMin = Math.abs(clickValue - values[0]);
    const distToMax = Math.abs(clickValue - values[1]);
    
    if (distToMin < distToMax) {
      const snapped = Number((Math.round(clickValue / step) * step).toFixed(decimals));
      onChange([Math.max(min, Math.min(snapped, values[1] - step)), values[1]]);
      setDragging('min');
    } else {
      const snapped = Number((Math.round(clickValue / step) * step).toFixed(decimals));
      onChange([values[0], Math.min(max, Math.max(snapped, values[0] + step))]);
      setDragging('max');
    }
  };
  
  const showValues = isTrackHovered || dragging !== null;
  
  return (
    <div 
      className="space-y-2"
      onMouseEnter={() => setIsTrackHovered(true)}
      onMouseLeave={() => {
        if (!dragging) setIsTrackHovered(false);
      }}
    >
      <label className="block text-xs uppercase tracking-widest text-neutral-500">{label}</label>
      
      {/* Value displays that move with handles */}
      <div className="relative h-6">
        {/* Min value */}
        <div 
          className={`absolute -translate-x-1/2 transition-all duration-150 ease-out ${
            showValues ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ left: `${minPercent}%` }}
        >
          <span className="px-2 py-1 bg-neutral-800 text-white text-xs font-mono rounded-md whitespace-nowrap">
            {format(values[0])}
          </span>
        </div>
        
        {/* Max value */}
        <div 
          className={`absolute -translate-x-1/2 transition-all duration-150 ease-out ${
            showValues ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ left: `${maxPercent}%` }}
        >
          <span className="px-2 py-1 bg-neutral-800 text-white text-xs font-mono rounded-md whitespace-nowrap">
            {format(values[1])}
          </span>
        </div>
      </div>
      
      {/* Slider Track */}
      <div className="relative py-2">
        {/* Invisible larger hit area for easier interaction */}
        <div 
          ref={trackRef}
          className="absolute inset-0 cursor-pointer"
          style={{ top: '-8px', bottom: '-8px', height: 'calc(100% + 16px)' }}
          onClick={handleTrackClick}
          onMouseDown={(e) => {
            e.preventDefault();
            handleTrackClick(e);
          }}
        />
        
        {/* Visible thin track background */}
        <div className="relative h-1 bg-neutral-800 rounded-full pointer-events-none">
          {/* Active range fill */}
          <div 
            className="absolute h-full bg-white/80 rounded-full transition-all duration-150 ease-out"
            style={{ 
              left: `${minPercent}%`, 
              width: `${maxPercent - minPercent}%` 
            }}
          />
        </div>
        
        {/* Min Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out"
          style={{ left: `${minPercent}%` }}
        >
          {/* Invisible larger hit area for handle */}
          <div 
            className="absolute -inset-3 cursor-grab"
            onMouseDown={(e) => {
              e.preventDefault();
              setDragging('min');
            }}
            onTouchStart={() => setDragging('min')}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setDragging(null)}
            onMouseEnter={() => setHoverHandle('min')}
            onMouseLeave={() => setHoverHandle(null)}
          />
          
          {/* Handle - small, visible on hover */}
          <div
            className={`w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-all duration-200 ease-out ${
              dragging === 'min' 
                ? 'opacity-100 scale-110' 
                : showValues
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
            }`}
          />
        </div>
        
        {/* Max Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out"
          style={{ left: `${maxPercent}%` }}
        >
          {/* Invisible larger hit area for handle */}
          <div 
            className="absolute -inset-3 cursor-grab"
            onMouseDown={(e) => {
              e.preventDefault();
              setDragging('max');
            }}
            onTouchStart={() => setDragging('max')}
            onTouchMove={handleTouchMove}
            onTouchEnd={() => setDragging(null)}
            onMouseEnter={() => setHoverHandle('max')}
            onMouseLeave={() => setHoverHandle(null)}
          />
          
          {/* Handle - small, visible on hover */}
          <div
            className={`w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-all duration-200 ease-out ${
              dragging === 'max' 
                ? 'opacity-100 scale-110' 
                : showValues
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75'
            }`}
          />
        </div>
      </div>
      
      {/* Min/Max labels */}
      <div className="flex justify-between text-xs text-neutral-600">
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
};

// Single Slider with moving value tooltip
const Slider = ({ label, value, onChange, min, max, step = 1, unit = "" }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  
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
      <label className="block text-xs uppercase tracking-widest text-neutral-500">{label}</label>
      
      {/* Value display that moves with handle */}
      <div className="relative h-6">
        <div 
          className={`absolute -translate-x-1/2 transition-all duration-150 ease-out ${
            showValue ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ left: `${percent}%` }}
        >
          <span className="px-2 py-1 bg-neutral-800 text-white text-xs font-mono rounded-md whitespace-nowrap">
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
        <div className="relative h-1 bg-neutral-800 rounded-full pointer-events-none">
          {/* Fill */}
          <div 
            className="absolute h-full bg-white/80 rounded-full transition-all duration-150 ease-out"
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
            className={`w-3 h-3 bg-white rounded-full shadow-md pointer-events-none transition-all duration-200 ease-out ${
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
      <div className="flex justify-between text-xs text-neutral-600">
        <span>{formatVal(min)}{unit}</span>
        <span>{formatVal(max)}{unit}</span>
      </div>
    </div>
  );
};

// Multi-add Location Input with Search
const LocationAdder = ({ label, options, selected, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);
  
  const addLocation = (loc) => {
    if (!selected.includes(loc)) {
      onChange([...selected, loc]);
    }
    setIsOpen(false);
    setSearchQuery('');
  };
  
  const removeLocation = (loc) => {
    onChange(selected.filter(l => l !== loc));
  };
  
  // Filter options based on search query
  const filteredOptions = options
    .filter(o => !selected.includes(o))
    .filter(o => o.toLowerCase().includes(searchQuery.toLowerCase()));
  
  return (
    <div className="space-y-3">
      <label className="block text-xs uppercase tracking-widest text-neutral-500">{label}</label>
      
      {/* Selected locations */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map(loc => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-neutral-800 rounded-lg text-sm text-neutral-300 transition-all duration-200 hover:bg-neutral-700"
            >
              {loc}
              <button
                onClick={() => removeLocation(loc)}
                className="ml-1 text-neutral-500 hover:text-white transition-colors duration-200"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Add button / Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-3 bg-neutral-900 border rounded-lg text-left text-sm transition-all duration-200 flex items-center justify-between ${
            isOpen 
              ? 'border-neutral-600 text-neutral-400' 
              : 'border-neutral-800 text-neutral-500 hover:border-neutral-600'
          }`}
        >
          <span>+ Add {placeholder || 'location'}</span>
          {isOpen && (
            <span className="text-neutral-600 text-xs">ESC to close</span>
          )}
        </button>
        
        {/* Dropdown with animation */}
        <div className={`absolute z-50 w-full mt-1 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl overflow-hidden transition-all duration-200 ease-out origin-top ${
          isOpen 
            ? 'opacity-100 scale-y-100 translate-y-0' 
            : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'
        }`}>
          {/* Search Input */}
          <div className="p-2 border-b border-neutral-800">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${placeholder || 'location'}...`}
                className="w-full pl-9 pr-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors duration-200"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => addLocation(opt)}
                  className="w-full px-4 py-2 text-left text-sm text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all duration-150"
                >
                  {/* Highlight matching text */}
                  {searchQuery ? (
                    <span>
                      {opt.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                        part.toLowerCase() === searchQuery.toLowerCase() 
                          ? <span key={i} className="text-white font-medium">{part}</span>
                          : part
                      ))}
                    </span>
                  ) : opt}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-neutral-600 text-center">
                {searchQuery ? `No results for "${searchQuery}"` : 'All options selected'}
              </div>
            )}
          </div>
          
          {/* Results count */}
          {filteredOptions.length > 0 && searchQuery && (
            <div className="px-4 py-2 border-t border-neutral-800 text-xs text-neutral-600">
              {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Section Card with smooth accordion
const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(defaultOpen ? 'auto' : 0);
  
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);
  
  return (
    <div className="border border-neutral-800 rounded-xl transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between bg-neutral-900/50 hover:bg-neutral-900 transition-all duration-200 rounded-t-xl"
      >
        <span className="flex items-center gap-3 text-white font-medium">
          <span className="text-lg">{icon}</span>
          {title}
        </span>
        <span className={`text-neutral-500 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      <div 
        className="transition-all duration-300 ease-out"
        style={{ 
          maxHeight: isOpen ? `${contentHeight + 200}px` : '0px',
          overflow: isOpen ? 'visible' : 'hidden'
        }}
      >
        <div ref={contentRef} className="p-5 space-y-5 bg-black/30 rounded-b-xl">
          {children}
        </div>
      </div>
    </div>
  );
};

// Recommendation Card
const RecommendationCard = ({ rec, rank }) => (
  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 transition-all duration-300 ease-out hover:border-neutral-700 hover:shadow-lg hover:shadow-black/50 hover:-translate-y-0.5">
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs font-mono bg-white text-black px-2 py-0.5 rounded transition-transform duration-200 hover:scale-105">
            #{rank}
          </span>
          <span className="text-lg font-medium text-white">{rec.town}</span>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 transition-colors duration-200 hover:bg-neutral-700">{rec.flatType}</span>
          <span className="px-2 py-1 bg-neutral-800 rounded text-xs text-neutral-400 transition-colors duration-200 hover:bg-neutral-700">{rec.flatModel}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-2xl font-mono text-white">${rec.predictedPrice.toLocaleString()}</p>
        <p className="text-xs text-neutral-600 font-mono">
          ${rec.priceRange.low.toLocaleString()} – ${rec.priceRange.high.toLocaleString()}
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-4 gap-3 py-3 border-t border-b border-neutral-800 mb-3">
      <div>
        <p className="text-xs text-neutral-600">Floor Area</p>
        <p className="text-sm text-neutral-300">{rec.floorArea.min}-{rec.floorArea.max} sqm</p>
      </div>
      <div>
        <p className="text-xs text-neutral-600">Storey</p>
        <p className="text-sm text-neutral-300">{rec.storeyRange}</p>
      </div>
      <div>
        <p className="text-xs text-neutral-600">Lease Left</p>
        <p className="text-sm text-neutral-300">{rec.remainingLease} yrs</p>
      </div>
      <div>
        <p className="text-xs text-neutral-600">Match</p>
        <p className="text-sm text-emerald-400">{rec.matchScore}%</p>
      </div>
    </div>
    
    <div className="flex gap-4 text-xs text-neutral-500">
      <span className="transition-colors duration-200 hover:text-neutral-300">🚇 {rec.distances.mrt}km</span>
      <span className="transition-colors duration-200 hover:text-neutral-300">🏫 {rec.distances.school}km</span>
      <span className="transition-colors duration-200 hover:text-neutral-300">🛒 {rec.distances.mall}km</span>
      <span className="transition-colors duration-200 hover:text-neutral-300">🍜 {rec.distances.hawker}km</span>
    </div>
  </div>
);

// ============== MAIN APP ==============
export default function App() {
  // Form state
  const [targetYear, setTargetYear] = useState(2026);
  const [budget, setBudget] = useState([400000, 700000]);
  const [towns, setTowns] = useState([]);
  const [flatTypes, setFlatTypes] = useState([]);
  const [flatModels, setFlatModels] = useState([]);
  const [floorArea, setFloorArea] = useState([70, 120]);
  const [storeyRanges, setStoreyRanges] = useState([]);
  const [minLease, setMinLease] = useState(60);
  
  // Amenity distances
  const [maxMrt, setMaxMrt] = useState(1.0);
  const [maxSchool, setMaxSchool] = useState(1.0);
  const [maxMall, setMaxMall] = useState(1.5);
  const [maxHawker, setMaxHawker] = useState(1.0);
  
  // Frequent destinations
  const [workLocations, setWorkLocations] = useState([]);
  const [schoolLocations, setSchoolLocations] = useState([]);
  const [parentsTowns, setParentsTowns] = useState([]);
  const [eatingPlaces, setEatingPlaces] = useState([]);
  const [shoppingPlaces, setShoppingPlaces] = useState([]);
  const [gymLocations, setGymLocations] = useState([]);
  
  // Results
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    
    const criteria = {
      targetYear,
      budget,
      towns,
      flatTypes,
      flatModels,
      floorArea,
      storeyRanges,
      minLease,
      maxDistances: { mrt: maxMrt, school: maxSchool, mall: maxMall, hawker: maxHawker },
      destinations: { workLocations, schoolLocations, parentsTowns, eatingPlaces, shoppingPlaces, gymLocations }
    };
    
    const results = generateRecommendations(criteria);
    setRecommendations(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8 overflow-visible">
          
          {/* Left: Filters (3 cols) */}
          <div className="lg:col-span-3 space-y-4 overflow-visible">
            
            {/* Section 1: Purchase Plan */}
            <Section title="Purchase Plan" icon="📅" defaultOpen={true}>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-neutral-500 mb-3">
                    Target Purchase Year
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PREDICTION_YEARS.map(year => (
                      <button
                        key={year}
                        onClick={() => setTargetYear(year)}
                        className={`py-3 rounded-lg text-sm font-medium transition-all duration-200 ease-out transform active:scale-95 ${
                          targetYear === year
                            ? 'bg-white text-black shadow-lg shadow-white/10'
                            : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                
                <RangeSlider
                  label="Budget Range"
                  min={200000}
                  max={1500000}
                  step={25000}
                  values={budget}
                  onChange={setBudget}
                  formatValue={(v) => `$${(v/1000).toFixed(0)}K`}
                />
              </div>
            </Section>

            {/* Section 2: Property Criteria */}
            <Section title="Property Criteria" icon="🏠" defaultOpen={true}>
              <ChipSelect
                label="Preferred Towns"
                options={HDB_TOWNS}
                selected={towns}
                onChange={setTowns}
                maxShow={10}
              />
              
              <ChipSelect
                label="Flat Type"
                options={FLAT_TYPES}
                selected={flatTypes}
                onChange={setFlatTypes}
                maxShow={10}
              />
              
              <ChipSelect
                label="Flat Model (Optional)"
                options={FLAT_MODELS}
                selected={flatModels}
                onChange={setFlatModels}
                maxShow={6}
              />
              
              <RangeSlider
                label="Floor Area"
                min={35}
                max={180}
                step={5}
                values={floorArea}
                onChange={setFloorArea}
                unit=" sqm"
              />
              
              <ChipSelect
                label="Storey Range (Optional)"
                options={STOREY_RANGES}
                selected={storeyRanges}
                onChange={setStoreyRanges}
                maxShow={6}
              />
              
              <Slider
                label="Minimum Remaining Lease"
                value={minLease}
                onChange={setMinLease}
                min={40}
                max={95}
                unit=" years"
              />
            </Section>

            {/* Section 3: Amenity Proximity */}
            <Section title="Amenity Proximity" icon="📍" defaultOpen={true}>
              <Slider
                label="Max Distance to MRT"
                value={maxMrt}
                onChange={setMaxMrt}
                min={0.3}
                max={2.0}
                step={0.1}
                unit=" km"
              />
              
              <Slider
                label="Max Distance to School"
                value={maxSchool}
                onChange={setMaxSchool}
                min={0.3}
                max={2.0}
                step={0.1}
                unit=" km"
              />
              
              <Slider
                label="Max Distance to Mall"
                value={maxMall}
                onChange={setMaxMall}
                min={0.3}
                max={3.0}
                step={0.1}
                unit=" km"
              />
              
              <Slider
                label="Max Distance to Hawker"
                value={maxHawker}
                onChange={setMaxHawker}
                min={0.3}
                max={2.0}
                step={0.1}
                unit=" km"
              />
            </Section>

            {/* Section 4: Frequent Destinations (Optional) */}
            <Section title="Frequent Destinations" icon="🗺" defaultOpen={false}>
              <p className="text-xs text-neutral-600 mb-4">
                Add locations you visit frequently. We'll find flats convenient to these places. All fields are optional.
              </p>
              
              <LocationAdder
                label="Work Locations"
                options={WORK_LOCATIONS}
                selected={workLocations}
                onChange={setWorkLocations}
                placeholder="work location"
              />
              
              <LocationAdder
                label="School Locations"
                options={SCHOOLS_SAMPLE}
                selected={schoolLocations}
                onChange={setSchoolLocations}
                placeholder="school"
              />
              
              <LocationAdder
                label="Parents' Home Town"
                options={HDB_TOWNS}
                selected={parentsTowns}
                onChange={setParentsTowns}
                placeholder="town"
              />
              
              <LocationAdder
                label="Favourite Eating Places"
                options={HAWKER_SAMPLE}
                selected={eatingPlaces}
                onChange={setEatingPlaces}
                placeholder="hawker/food centre"
              />
              
              <LocationAdder
                label="Shopping Places"
                options={MALLS_SAMPLE}
                selected={shoppingPlaces}
                onChange={setShoppingPlaces}
                placeholder="mall"
              />
              
              <LocationAdder
                label="Gym / Fitness"
                options={GYM_SAMPLE}
                selected={gymLocations}
                onChange={setGymLocations}
                placeholder="gym"
              />
            </Section>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="relative z-0 w-full py-4 bg-white text-black rounded-xl font-semibold text-lg
                       transition-all duration-300 ease-out
                       hover:bg-neutral-200 hover:shadow-xl hover:shadow-white/20 hover:-translate-y-0.5
                       active:translate-y-0 active:shadow-lg
                       disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none
                       shadow-lg shadow-white/10"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching...
                </span>
              ) : (
                "Find Recommendations"
              )}
            </button>
          </div>

          {/* Right: Results (2 cols) */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                Recommendations
                {recommendations && (
                  <span className="text-xs font-normal text-neutral-500">
                    for {targetYear}
                  </span>
                )}
              </h2>
              
              {!recommendations ? (
                <div className="border border-dashed border-neutral-800 rounded-xl p-10 text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-neutral-900 flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p className="text-neutral-500 text-sm">
                    Set your preferences and click<br />"Find Recommendations"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-mono text-white">{recommendations.length}</p>
                        <p className="text-xs text-neutral-500">Matches Found</p>
                      </div>
                      <div>
                        <p className="text-2xl font-mono text-white">
                          ${(recommendations[0]?.predictedPrice / 1000).toFixed(0)}K
                        </p>
                        <p className="text-xs text-neutral-500">Best Match Price</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Results */}
                  {recommendations.map((rec, i) => (
                    <RecommendationCard key={rec.id} rec={rec} rank={i + 1} />
                  ))}
                  
                  {/* Disclaimer */}
                  <p className="text-xs text-neutral-700 text-center pt-4">
                    Prices are ML predictions for {targetYear}. Actual prices may vary.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 mt-10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-neutral-600">
          <span>Based on 217K+ HDB transactions & ML price predictions</span>
          <span>Data Minions • SUTD Production Ready ML</span>
        </div>
      </footer>
    </div>
  );
}