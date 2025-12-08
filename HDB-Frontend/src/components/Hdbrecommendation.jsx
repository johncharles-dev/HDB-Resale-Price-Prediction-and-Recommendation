import React, { useState, useRef, useEffect } from 'react';

// Theme helper - generates class names based on isDark prop
const getTheme = (isDark) => ({
  bg: isDark ? 'bg-black' : 'bg-gray-50',
  bgCard: isDark ? 'bg-neutral-900' : 'bg-white',
  bgInput: isDark ? 'bg-neutral-900' : 'bg-white',
  bgSection: isDark ? 'bg-neutral-900/50' : 'bg-gray-50',
  bgTrack: isDark ? 'bg-neutral-800' : 'bg-gray-100',
  bgFill: isDark ? 'bg-white' : 'bg-gray-900',
  bgHandle: isDark ? 'bg-white' : 'bg-gray-900',
  bgHover: isDark ? 'bg-neutral-800' : 'bg-gray-100',
  bgTooltip: isDark ? 'bg-neutral-800' : 'bg-gray-100',
  bgEmpty: isDark ? 'bg-neutral-900' : 'bg-gray-100',
  bgSelected: isDark ? 'bg-white' : 'bg-gray-900',
  text: isDark ? 'text-white' : 'text-gray-900',
  textSecondary: isDark ? 'text-neutral-400' : 'text-gray-600',
  textMuted: isDark ? 'text-neutral-500' : 'text-gray-500',
  textLabel: isDark ? 'text-neutral-500' : 'text-gray-700',
  textSelected: isDark ? 'text-black' : 'text-white',
  border: isDark ? 'border-neutral-800' : 'border-gray-200',
  borderInput: isDark ? 'border-neutral-800' : 'border-gray-300',
  borderHover: isDark ? 'border-neutral-700' : 'border-gray-400',
  borderFocus: isDark ? 'border-neutral-600' : 'border-gray-400',
  borderDashed: isDark ? 'border-neutral-800' : 'border-gray-300',
  btnPrimary: isDark ? 'bg-white text-black hover:bg-neutral-200' : 'bg-gray-900 text-white hover:bg-gray-800',
  btnChip: isDark 
    ? 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white' 
    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400 hover:text-gray-900',
  btnChipSelected: isDark ? 'bg-white text-black shadow-lg' : 'bg-gray-900 text-white shadow-lg',
  tagBg: isDark ? 'bg-neutral-800' : 'bg-gray-100',
  tagText: isDark ? 'text-neutral-300' : 'text-gray-700',
  matchGood: isDark ? 'text-emerald-400' : 'text-emerald-600',
});

// ============== ICONS ==============
const Icons = {
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  home: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  mapPin: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  map: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  ),
  briefcase: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
    </svg>
  ),
  academic: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  search: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  train: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 18v-2m8 2v-2M5 10h14M6 14h.01M18 14h.01M7 6h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2V8a2 2 0 012-2zm5-2v2" />
    </svg>
  ),
  school: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  ),
  cart: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
    </svg>
  ),
  utensils: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
    </svg>
  ),
  pin: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
};

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

const FREQUENCY_OPTIONS = [
  "Daily (5x per week)",
  "3-4x per week",
  "1-2x per week",
  "Weekly (1x per week)",
  "2-3x per month",
  "Monthly (1x per month)",
  "Rarely"
];

const PERSON_OPTIONS = ["You", "Spouse", "Partner", "Family Member"];

const PREDICTION_YEARS = [2025, 2026, 2027, 2028];

// ============== MOCK RECOMMENDATION (NO LONGER USED - KEPT FOR REFERENCE) ==============
// This function has been replaced by the real API call in handleSearch
// The /recommend endpoint returns data in the same format
/*
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
*/

// ============== COMPONENTS ==============

// Multi-select Chips
const ChipSelect = ({ label, options, selected, onChange, maxShow = 8, isDark = false }) => {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const t = getTheme(isDark);
  
  // Filter options based on search
  const filteredOptions = searchQuery 
    ? options.filter(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;
  
  // Display options (respect maxShow only when not searching)
  const displayOptions = searchQuery 
    ? filteredOptions 
    : (showAll ? options : options.slice(0, maxShow));
  
  const toggle = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  
  // Highlight matching text
  const highlightMatch = (text) => {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded">{part}</mark> : part
    );
  };
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={`block text-xs uppercase tracking-widest ${t.textLabel}`}>{label}</label>
        {options.length > 8 && (
          <button
            onClick={() => {
              setIsSearching(!isSearching);
              setSearchQuery('');
              if (!isSearching) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }
            }}
            className={`text-xs ${t.textMuted} hover:${t.text} flex items-center gap-1 transition-colors`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isSearching ? 'Close' : 'Search'}
          </button>
        )}
      </div>
      
      {/* Search input */}
      {isSearching && (
        <div className="relative">
          <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${t.textMuted}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className={`w-full pl-9 pr-3 py-2 text-sm ${t.bgInput} border ${t.borderInput} ${t.text} rounded-lg focus:outline-none focus:${t.borderFocus}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${t.textMuted} hover:${t.text}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {displayOptions.length === 0 ? (
          <span className={`text-sm ${t.textMuted}`}>No results found</span>
        ) : (
          displayOptions.map(opt => (
            <button
              key={opt}
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ease-out transform active:scale-95 ${
                selected.includes(opt)
                  ? t.btnChipSelected
                  : `${t.bgInput} ${t.textSecondary} border ${t.borderInput} hover:${t.borderHover} hover:${t.text}`
              }`}
            >
              {highlightMatch(opt)}
            </button>
          ))
        )}
        {!searchQuery && options.length > maxShow && (
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-3 py-1.5 text-sm ${t.textSecondary} hover:${t.text} transition-colors duration-200`}
          >
            {showAll ? '− Show less' : `+ ${options.length - maxShow} more`}
          </button>
        )}
      </div>
      <div className={`text-xs ${t.textSecondary} transition-all duration-200 ${selected.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
        {selected.length} selected
      </div>
    </div>
  );
};

// Range Slider with dual handles on single track
const RangeSlider = ({ label, min, max, values, onChange, unit = "", step = 1, formatValue, isDark = false }) => {
  const t = getTheme(isDark);
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
      <label className={`block text-xs uppercase tracking-widest ${t.textLabel}`}>{label}</label>
      
      {/* Value displays that move with handles */}
      <div className="relative h-6">
        {/* Min value */}
        <div 
          className={`absolute -translate-x-1/2 transition-all duration-150 ease-out ${
            showValues ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ left: `${minPercent}%` }}
        >
          <span className={`px-2 py-1 ${t.bgTooltip} ${t.text} text-xs font-mono rounded-md whitespace-nowrap`}>
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
          <span className={`px-2 py-1 ${t.bgTooltip} ${t.text} text-xs font-mono rounded-md whitespace-nowrap`}>
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
        <div className={`relative h-1 ${t.bgTrack} rounded-full pointer-events-none`}>
          {/* Active range fill */}
          <div 
            className={`absolute h-full ${t.bgFill} rounded-full transition-all duration-150 ease-out`}
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
            className={`w-3 h-3 ${t.bgHandle} rounded-full shadow-md pointer-events-none transition-all duration-200 ease-out ${
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
            className={`w-3 h-3 ${t.bgHandle} rounded-full shadow-md pointer-events-none transition-all duration-200 ease-out ${
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
      <div className={`flex justify-between text-xs ${t.textSecondary}`}>
        <span>{format(min)}</span>
        <span>{format(max)}</span>
      </div>
    </div>
  );
};

// Single Slider with moving value tooltip
const Slider = ({ label, value, onChange, min, max, step = 1, unit = "", isDark = false }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const t = getTheme(isDark);
  
  const percent = ((value - min) / (max - min)) * 100;
  
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
      onMouseLeave={() => { if (!isDragging) setIsHovering(false); }}
    >
      <label className={`block text-xs uppercase tracking-widest ${t.textLabel}`}>{label}</label>
      
      <div className="relative h-6">
        <div 
          className={`absolute -translate-x-1/2 transition-all duration-150 ease-out ${showValue ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ left: `${percent}%` }}
        >
          <span className={`px-2 py-1 ${t.bgTooltip} ${t.text} text-xs font-mono rounded-md whitespace-nowrap`}>
            {formatVal(value)}{unit}
          </span>
        </div>
      </div>
      
      <div className="relative py-2">
        <div 
          ref={trackRef}
          className="absolute inset-0 cursor-pointer"
          style={{ top: '-8px', bottom: '-8px', height: 'calc(100% + 16px)' }}
          onClick={(e) => handleMove(e.clientX)}
          onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); handleMove(e.clientX); }}
        />
        <div className={`relative h-1 ${t.bgTrack} rounded-full pointer-events-none`}>
          <div className={`absolute h-full ${t.bgFill} rounded-full transition-all duration-150 ease-out`} style={{ width: `${percent}%` }} />
        </div>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-150 ease-out" style={{ left: `${percent}%` }}>
          <div className="absolute -inset-3 cursor-grab" onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }} />
          <div className={`w-3 h-3 ${t.bgHandle} rounded-full shadow-md pointer-events-none transition-all duration-200 ease-out ${isDragging ? 'opacity-100 scale-110' : showValue ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
        </div>
      </div>
      
      <div className={`flex justify-between text-xs ${t.textSecondary}`}>
        <span>{formatVal(min)}{unit}</span>
        <span>{formatVal(max)}{unit}</span>
      </div>
    </div>
  );
};

// Optional Slider with "No Preference" toggle for amenity distances
const OptionalSlider = ({ label, value, onChange, min, max, step = 0.1, unit = "", isDark = false, defaultValue = null }) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);
  const t = getTheme(isDark);
  
  const isEnabled = value !== null;
  const displayValue = isEnabled ? value : defaultValue || min;
  const percent = ((displayValue - min) / (max - min)) * 100;
  
  const formatVal = (v) => {
    const decimals = step < 1 ? String(step).split('.')[1]?.length || 1 : 0;
    return Number(v).toFixed(decimals);
  };
  
  const handleMove = (clientX) => {
    if (!trackRef.current || !isEnabled) return;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const rawValue = (pct / 100) * (max - min) + min;
    const snappedValue = Math.round(rawValue / step) * step;
    const decimals = step < 1 ? String(step).split('.')[1]?.length || 1 : 0;
    const fixedValue = Number(snappedValue.toFixed(decimals));
    onChange(Math.max(min, Math.min(max, fixedValue)));
  };
  
  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };
  
  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleMouseUp = () => setIsDragging(false);
    const handleTouchEnd = () => setIsDragging(false);
    
    if (isDragging && isEnabled) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, isEnabled]);
  
  const handleToggle = () => {
    if (isEnabled) {
      onChange(null);
    } else {
      onChange(defaultValue || ((max - min) / 3 + min));
    }
  };
  
  const showValue = (isHovering || isDragging) && isEnabled;
  
  return (
    <div 
      className="space-y-2 mb-5"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => { if (!isDragging) setIsHovering(false); }}
    >
      {/* Label row with toggle */}
      <div className="flex items-center justify-between">
        <label className={`block text-xs uppercase tracking-widest font-medium ${t.textLabel}`}>{label}</label>
        <button
          onClick={handleToggle}
          className={`flex items-center gap-2 text-xs font-medium transition-all duration-200 ${isEnabled ? (isDark ? 'text-neutral-300' : 'text-gray-700') : (isDark ? 'text-neutral-500' : 'text-gray-400')}`}
        >
          <span>{isEnabled ? 'Limit set' : 'Any distance'}</span>
          <div className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${isEnabled ? (isDark ? 'bg-neutral-600' : 'bg-gray-600') : (isDark ? 'bg-neutral-700' : 'bg-gray-300')}`}>
            <div 
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isEnabled ? 'left-4' : 'left-0.5'}`} 
            />
          </div>
        </button>
      </div>
      
      {/* Value display tooltip */}
      <div className="relative h-7">
        <div 
          className={`absolute -translate-x-1/2 transition-all duration-150 ${showValue ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ left: `${percent}%` }}
        >
          <span className={`px-2 py-1 ${isDark ? 'bg-neutral-800' : 'bg-gray-800'} text-white text-xs font-mono rounded shadow whitespace-nowrap`}>
            {formatVal(displayValue)} {unit}
          </span>
        </div>
      </div>
      
      {/* Slider track */}
      <div className={`relative py-3 transition-opacity duration-200 ${isEnabled ? 'opacity-100' : 'opacity-40'}`}>
        <div 
          ref={trackRef}
          className={`absolute inset-0 ${isEnabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          style={{ top: '-12px', bottom: '-12px', height: 'calc(100% + 24px)' }}
          onClick={(e) => isEnabled && handleMove(e.clientX)}
          onMouseDown={(e) => { if (!isEnabled) return; e.preventDefault(); setIsDragging(true); handleMove(e.clientX); }}
          onTouchStart={(e) => { if (!isEnabled) return; setIsDragging(true); handleTouchMove(e); }}
        />
        {/* Track background */}
        <div className={`relative h-0.5 ${isDark ? 'bg-neutral-700' : 'bg-gray-300'} rounded-full pointer-events-none`}>
          {/* Track fill */}
          <div 
            className={`absolute h-full rounded-full pointer-events-none ${isDark ? 'bg-white' : 'bg-gray-800'}`} 
            style={{ 
              width: `${percent}%`,
              transition: isDragging ? 'none' : 'width 0.1s ease-out'
            }} 
          />
        </div>
        {/* Handle */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none" 
          style={{ 
            left: `${percent}%`,
            transition: isDragging ? 'none' : 'left 0.1s ease-out'
          }}
        >
          <div 
            className={`absolute -inset-4 ${isEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'} pointer-events-auto`} 
            onMouseDown={(e) => { if (!isEnabled) return; e.preventDefault(); setIsDragging(true); }} 
            onTouchStart={(e) => { if (!isEnabled) return; setIsDragging(true); }}
          />
          <div 
            className={`relative w-3.5 h-3.5 rounded-full border-2 transition-transform duration-100 ${
              isEnabled 
                ? `${isDark ? 'bg-white border-white' : 'bg-white border-gray-800'} ${isDragging ? 'scale-125' : ''}` 
                : (isDark ? 'bg-neutral-500 border-neutral-500' : 'bg-gray-400 border-gray-400')
            }`} 
          />
        </div>
      </div>
      
      {/* Min/Max labels */}
      <div className={`flex justify-between text-xs ${t.textSecondary}`}>
        <span>{formatVal(min)} {unit}</span>
        <span className={`transition-opacity duration-200 ${isEnabled ? 'opacity-0' : 'opacity-100'}`}>(No limit)</span>
        <span>{formatVal(max)} {unit}</span>
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
      <label className="block text-xs uppercase tracking-widest text-gray-700">{label}</label>
      
      {/* Selected locations */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map(loc => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm text-gray-700 transition-all duration-200 hover:bg-gray-200"
            >
              {loc}
              <button
                onClick={() => removeLocation(loc)}
                className="ml-1 text-gray-700 hover:text-gray-900 transition-colors duration-200"
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
          className={`w-full px-4 py-3 bg-white border rounded-lg text-left text-sm transition-all duration-200 flex items-center justify-between ${
            isOpen 
              ? 'border-gray-400 text-gray-600' 
              : 'border-gray-200 text-gray-700 hover:border-gray-400'
          }`}
        >
          <span>+ Add {placeholder || 'location'}</span>
          {isOpen && (
            <span className="text-gray-600 text-xs">ESC to close</span>
          )}
        </button>
        
        {/* Dropdown with animation */}
        <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ease-out origin-top ${
          isOpen 
            ? 'opacity-100 scale-y-100 translate-y-0' 
            : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'
        }`}>
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" 
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
                className="w-full pl-9 pr-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-neutral-500 focus:outline-none focus:border-gray-400 transition-colors duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
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
                  className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-150"
                >
                  {/* Highlight matching text */}
                  {searchQuery ? (
                    <span>
                      {opt.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => (
                        part.toLowerCase() === searchQuery.toLowerCase() 
                          ? <span key={i} className="text-gray-900 font-medium">{part}</span>
                          : part
                      ))}
                    </span>
                  ) : opt}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-600 text-center">
                {searchQuery ? `No results for "${searchQuery}"` : 'All options selected'}
              </div>
            )}
          </div>
          
          {/* Results count */}
          {filteredOptions.length > 0 && searchQuery && (
            <div className="px-4 py-2 border-t border-gray-200 text-xs text-gray-600">
              {filteredOptions.length} result{filteredOptions.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple Select Dropdown
const SelectDropdown = ({ value, onChange, options, placeholder, isDark = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const t = getTheme(isDark);
  
  // Filter options based on search
  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
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
  
  // Focus search input when opening (only if many options)
  useEffect(() => {
    if (isOpen && searchInputRef.current && options.length > 5) {
      searchInputRef.current.focus();
    }
  }, [isOpen, options.length]);
  
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2.5 ${t.bgInput} border rounded-lg text-sm text-left flex items-center justify-between transition-all duration-200 ${
          isOpen ? t.borderFocus : `${t.borderInput} hover:${t.borderHover}`
        }`}
      >
        <span className={value ? t.text : t.textMuted}>
          {value || placeholder}
        </span>
        <svg className={`w-4 h-4 ${t.textMuted} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 ${t.bgCard} border ${t.border} rounded-lg shadow-xl overflow-hidden`}>
          {/* Search input - only show for dropdowns with many options */}
          {options.length > 5 && (
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
                  className={`w-full pl-9 pr-3 py-2 text-sm ${t.bgInput} border ${t.borderInput} ${t.text} rounded-md focus:outline-none`}
                />
              </div>
            </div>
          )}
          
          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className={`px-3 py-2 text-sm ${t.textMuted} text-center`}>No results found</div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => { 
                    onChange(opt); 
                    setIsOpen(false); 
                    setSearchQuery('');
                  }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                    value === opt 
                      ? `${isDark ? 'bg-neutral-800' : 'bg-gray-50'} ${t.text} font-medium` 
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
  );
};

// Work Locations Section
const WorkLocationsSection = ({ entries, onChange, isDark = false, workAreas = [] }) => {
  const t = getTheme(isDark);
  const locationOptions = workAreas.length > 0 ? workAreas : WORK_LOCATIONS;
  
  const addEntry = () => {
    const newId = Math.max(0, ...entries.map(e => e.id)) + 1;
    const personNum = entries.length + 1;
    const defaultPerson = personNum === 1 ? 'You' : personNum === 2 ? 'Spouse' : `Person ${personNum}`;
    onChange([...entries, { id: newId, person: defaultPerson, location: '', frequency: 'Daily (5x per week)' }]);
  };
  
  const updateEntry = (id, field, value) => {
    onChange(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  
  const removeEntry = (id) => {
    onChange(entries.filter(e => e.id !== id));
  };
  
  return (
    <div className={`space-y-3 p-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'} rounded-xl border ${t.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={t.textSecondary}>{Icons.briefcase}</span>
        <span className={`font-medium ${t.text}`}>Work Locations</span>
        {workAreas.length > 0 && (
          <span className={`text-xs ${t.textSecondary}`}>({workAreas.length} areas)</span>
        )}
      </div>
      
      {entries.map((entry) => (
        <div key={entry.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-3">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Person</label>
            <input
              type="text"
              value={entry.person}
              onChange={(e) => updateEntry(entry.id, 'person', e.target.value)}
              className={`w-full px-3 py-2.5 ${t.bgInput} border ${t.borderInput} ${t.text} rounded-lg text-sm focus:outline-none focus:${t.borderFocus}`}
            />
          </div>
          <div className="col-span-4">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Location</label>
            <SelectDropdown
              value={entry.location}
              onChange={(val) => updateEntry(entry.id, 'location', val)}
              options={locationOptions}
              placeholder="Select..."
              isDark={isDark}
            />
          </div>
          <div className="col-span-4">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Frequency</label>
            <SelectDropdown
              value={entry.frequency}
              onChange={(val) => updateEntry(entry.id, 'frequency', val)}
              options={FREQUENCY_OPTIONS}
              placeholder="Select..."
              isDark={isDark}
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => removeEntry(entry.id)}
              className={`p-2 text-red-500 hover:text-red-700 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} rounded-lg transition-colors`}
            >
              {Icons.trash}
            </button>
          </div>
        </div>
      ))}
      
      <button
        onClick={addEntry}
        className={`w-full py-2.5 border-2 border-dashed ${t.borderDashed} rounded-lg text-sm ${isDark ? 'text-blue-400 hover:border-blue-500 hover:bg-blue-500/10' : 'text-blue-600 hover:border-blue-400 hover:bg-blue-50'} font-medium transition-all`}
      >
        + {entries.length > 0 ? 'ADD ANOTHER WORK LOCATION' : 'ADD WORK LOCATION'}
      </button>
    </div>
  );
};

// School Locations Section
const SchoolLocationsSection = ({ entries, onChange, isDark = false, schools = [] }) => {
  const t = getTheme(isDark);
  const schoolOptions = schools.length > 0 ? schools : SCHOOLS_SAMPLE;
  
  const addEntry = () => {
    const newId = Math.max(0, ...entries.map(e => e.id)) + 1;
    const childNum = entries.length + 1;
    onChange([...entries, { id: newId, child: `Child ${childNum}`, school: '' }]);
  };
  
  const updateEntry = (id, field, value) => {
    onChange(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  
  const removeEntry = (id) => {
    onChange(entries.filter(e => e.id !== id));
  };
  
  return (
    <div className={`space-y-3 p-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'} rounded-xl border ${t.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={t.textSecondary}>{Icons.academic}</span>
        <span className={`font-medium ${t.text}`}>School Locations</span>
        {schools.length > 0 && (
          <span className={`text-xs ${t.textSecondary}`}>({schools.length} schools)</span>
        )}
      </div>
      
      {entries.map((entry) => (
        <div key={entry.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Child</label>
            <input
              type="text"
              value={entry.child}
              onChange={(e) => updateEntry(entry.id, 'child', e.target.value)}
              className={`w-full px-3 py-2.5 ${t.bgInput} border ${t.borderInput} ${t.text} rounded-lg text-sm focus:outline-none focus:${t.borderFocus}`}
            />
          </div>
          <div className="col-span-7">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>School</label>
            <SelectDropdown
              value={entry.school}
              onChange={(val) => updateEntry(entry.id, 'school', val)}
              options={schoolOptions}
              placeholder="Select school..."
              isDark={isDark}
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => removeEntry(entry.id)}
              className={`p-2 text-red-500 hover:text-red-700 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} rounded-lg transition-colors`}
            >
              {Icons.trash}
            </button>
          </div>
        </div>
      ))}
      
      <button
        onClick={addEntry}
        className={`w-full py-2.5 border-2 border-dashed ${t.borderDashed} rounded-lg text-sm ${isDark ? 'text-blue-400 hover:border-blue-500 hover:bg-blue-500/10' : 'text-blue-600 hover:border-blue-400 hover:bg-blue-50'} font-medium transition-all`}
      >
        + {entries.length > 0 ? 'ADD ANOTHER CHILD' : 'ADD CHILD'}
      </button>
    </div>
  );
};

// Parents' Homes Section
const ParentsHomesSection = ({ entries, onChange, isDark = false }) => {
  const t = getTheme(isDark);
  const addEntry = () => {
    const newId = Math.max(0, ...entries.map(e => e.id)) + 1;
    const parentNum = entries.length + 1;
    onChange([...entries, { id: newId, parent: `Parent ${parentNum}`, location: '', frequency: 'Weekly (1x per week)' }]);
  };
  
  const updateEntry = (id, field, value) => {
    onChange(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  
  const removeEntry = (id) => {
    onChange(entries.filter(e => e.id !== id));
  };
  
  return (
    <div className={`space-y-3 p-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'} rounded-xl border ${t.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={t.textSecondary}>{Icons.users}</span>
        <span className={`font-medium ${t.text}`}>Parents' Homes</span>
      </div>
      
      {entries.map((entry) => (
        <div key={entry.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-3">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Parent</label>
            <input
              type="text"
              value={entry.parent}
              onChange={(e) => updateEntry(entry.id, 'parent', e.target.value)}
              className={`w-full px-3 py-2.5 ${t.bgInput} border ${t.borderInput} ${t.text} rounded-lg text-sm focus:outline-none focus:${t.borderFocus}`}
            />
          </div>
          <div className="col-span-4">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Location</label>
            <SelectDropdown
              value={entry.location}
              onChange={(val) => updateEntry(entry.id, 'location', val)}
              options={HDB_TOWNS}
              placeholder="Select..."
              isDark={isDark}
            />
          </div>
          <div className="col-span-4">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Frequency</label>
            <SelectDropdown
              value={entry.frequency}
              onChange={(val) => updateEntry(entry.id, 'frequency', val)}
              options={FREQUENCY_OPTIONS}
              placeholder="Select..."
              isDark={isDark}
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => removeEntry(entry.id)}
              className={`p-2 text-red-500 hover:text-red-700 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} rounded-lg transition-colors`}
            >
              {Icons.trash}
            </button>
          </div>
        </div>
      ))}
      
      <button
        onClick={addEntry}
        className={`w-full py-2.5 border-2 border-dashed ${t.borderDashed} rounded-lg text-sm ${isDark ? 'text-blue-400 hover:border-blue-500 hover:bg-blue-500/10' : 'text-blue-600 hover:border-blue-400 hover:bg-blue-50'} font-medium transition-all`}
      >
        + {entries.length > 0 ? "ADD ANOTHER PARENT'S HOME" : "ADD PARENT'S HOME"}
      </button>
    </div>
  );
};

// Other Destinations Section (Hawker, Mall, Gym)
const OtherDestinationsSection = ({ entries, onChange, isDark = false }) => {
  const t = getTheme(isDark);
  const addEntry = () => {
    const newId = Math.max(0, ...entries.map(e => e.id)) + 1;
    onChange([...entries, { id: newId, type: 'Hawker', location: '', frequency: '1-2x per week' }]);
  };
  
  const updateEntry = (id, field, value) => {
    onChange(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };
  
  const removeEntry = (id) => {
    onChange(entries.filter(e => e.id !== id));
  };
  
  const getOptionsForType = (type) => {
    switch(type) {
      case 'Hawker': return HAWKER_SAMPLE;
      case 'Mall': return MALLS_SAMPLE;
      case 'Gym': return GYM_SAMPLE;
      default: return [];
    }
  };
  
  return (
    <div className={`space-y-3 p-4 ${isDark ? 'bg-neutral-800/50' : 'bg-gray-50'} rounded-xl border ${t.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={t.textSecondary}>{Icons.mapPin}</span>
        <span className={`font-medium ${t.text}`}>Other Frequent Places</span>
      </div>
      
      {entries.map((entry) => (
        <div key={entry.id} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-2">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Type</label>
            <SelectDropdown
              value={entry.type}
              onChange={(val) => updateEntry(entry.id, 'type', val)}
              options={['Hawker', 'Mall', 'Gym']}
              placeholder="Type"
              isDark={isDark}
            />
          </div>
          <div className="col-span-5">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Location</label>
            <SelectDropdown
              value={entry.location}
              onChange={(val) => updateEntry(entry.id, 'location', val)}
              options={getOptionsForType(entry.type)}
              placeholder="Select..."
              isDark={isDark}
            />
          </div>
          <div className="col-span-4">
            <label className={`block text-xs ${t.textSecondary} mb-1`}>Frequency</label>
            <SelectDropdown
              value={entry.frequency}
              onChange={(val) => updateEntry(entry.id, 'frequency', val)}
              options={FREQUENCY_OPTIONS}
              placeholder="Select..."
              isDark={isDark}
            />
          </div>
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => removeEntry(entry.id)}
              className={`p-2 text-red-500 hover:text-red-700 ${isDark ? 'hover:bg-red-500/20' : 'hover:bg-red-50'} rounded-lg transition-colors`}
            >
              {Icons.trash}
            </button>
          </div>
        </div>
      ))}
      
      <button
        onClick={addEntry}
        className={`w-full py-2.5 border-2 border-dashed ${t.borderDashed} rounded-lg text-sm ${isDark ? 'text-blue-400 hover:border-blue-500 hover:bg-blue-500/10' : 'text-blue-600 hover:border-blue-400 hover:bg-blue-50'} font-medium transition-all`}
      >
        + {entries.length > 0 ? 'ADD ANOTHER FREQUENT PLACE' : 'ADD FREQUENT PLACE'}
      </button>
    </div>
  );
};

// Section Card with smooth accordion
const Section = ({ title, icon, children, defaultOpen = true, isDark = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(defaultOpen ? 'auto' : 0);
  const t = getTheme(isDark);
  
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);
  
  return (
    <div className={`border ${t.border} rounded-xl transition-all duration-300 ${t.bgCard}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 flex items-center justify-between ${isDark ? 'bg-neutral-800/50 hover:bg-neutral-800' : 'bg-gray-50 hover:bg-gray-100'} transition-all duration-200 rounded-t-xl`}
      >
        <span className={`flex items-center gap-3 ${t.text} font-medium`}>
          <span className={t.textSecondary}>{icon}</span>
          {title}
        </span>
        <svg className={`w-4 h-4 ${t.textMuted} transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div 
        className="transition-all duration-300 ease-out"
        style={{ 
          maxHeight: isOpen ? `${contentHeight + 200}px` : '0px',
          overflow: isOpen ? 'visible' : 'hidden'
        }}
      >
        <div ref={contentRef} className={`p-5 space-y-5 ${t.bgCard} rounded-b-xl`}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Recommendation Card
const RecommendationCard = ({ rec, rank, isDark = false }) => {
  const t = getTheme(isDark);
  return (
    <div className={`${t.bgCard} border ${t.border} rounded-xl p-5 transition-all duration-300 ease-out hover:${t.borderHover} hover:shadow-lg hover:-translate-y-0.5`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-xs font-mono ${isDark ? 'bg-white text-black' : 'bg-gray-900 text-white'} px-2 py-0.5 rounded transition-transform duration-200 hover:scale-105`}>
              #{rank}
            </span>
            <span className={`text-lg font-medium ${t.text}`}>{rec.town}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} transition-colors duration-200`}>{rec.flatType}</span>
            <span className={`px-2 py-1 ${t.tagBg} rounded text-xs ${t.tagText} transition-colors duration-200`}>{rec.flatModel}</span>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-mono ${t.text}`}>${rec.predictedPrice.toLocaleString()}</p>
          <p className={`text-xs ${t.textSecondary} font-mono`}>
            ${rec.priceRange.low.toLocaleString()} – ${rec.priceRange.high.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className={`grid grid-cols-4 gap-3 py-3 border-t border-b ${t.border} mb-3`}>
        <div>
          <p className={`text-xs ${t.textSecondary}`}>Floor Area</p>
          <p className={`text-sm ${t.textSecondary}`}>{rec.floorArea.min}-{rec.floorArea.max} sqm</p>
        </div>
        <div>
          <p className={`text-xs ${t.textSecondary}`}>Storey</p>
          <p className={`text-sm ${t.textSecondary}`}>{rec.storeyRange}</p>
        </div>
        <div>
          <p className={`text-xs ${t.textSecondary}`}>Lease Left</p>
          <p className={`text-sm ${t.textSecondary}`}>{Math.round(rec.remainingLease)} yrs</p>
        </div>
        <div>
          <p className={`text-xs ${t.textSecondary}`}>Score</p>
          <p className={`text-sm ${t.matchGood}`}>{rec.matchScore}%</p>
        </div>
      </div>
      
      <div className={`flex gap-4 text-xs ${t.textSecondary}`}>
        <span className="flex items-center gap-1 transition-colors duration-200">{Icons.train} {rec.distances.mrt}km</span>
        <span className="flex items-center gap-1 transition-colors duration-200">{Icons.school} {rec.distances.school}km</span>
        <span className="flex items-center gap-1 transition-colors duration-200">{Icons.cart} {rec.distances.mall}km</span>
        <span className="flex items-center gap-1 transition-colors duration-200">{Icons.utensils} {rec.distances.hawker}km</span>
      </div>
    </div>
  );
};

// ============== MAIN APP ==============
export default function HDBRecommendation({ isDark = false }) {
  const t = getTheme(isDark);
  
  // Form state
  const [targetYear, setTargetYear] = useState(2026);
  const [budget, setBudget] = useState([400000, 700000]);
  const [towns, setTowns] = useState([]);
  const [flatTypes, setFlatTypes] = useState([]);
  const [flatModels, setFlatModels] = useState([]);
  const [floorArea, setFloorArea] = useState([70, 120]);
  const [storeyRanges, setStoreyRanges] = useState([]);
  const [leaseRange, setLeaseRange] = useState([30, 65]);
  
  // Amenity distances (null = no preference/any distance)
  const [maxMrt, setMaxMrt] = useState(null);      // range 0.3-2.0
  const [maxSchool, setMaxSchool] = useState(null); // range 0.3-1.0
  const [maxMall, setMaxMall] = useState(null);     // range 0.3-3.0
  const [maxHawker, setMaxHawker] = useState(null); // range 0.3-2.0
  
  // Frequent destinations - structured data
  const [workLocations, setWorkLocations] = useState([]);
  const [schoolLocations, setSchoolLocations] = useState([]);
  const [parentsHomes, setParentsHomes] = useState([]);
  const [otherDestinations, setOtherDestinations] = useState([]);
  
  // Fetched location data from API
  const [fetchedSchools, setFetchedSchools] = useState([]);
  const [fetchedWorkAreas, setFetchedWorkAreas] = useState([]);
  const [fetchedPoiCategories, setFetchedPoiCategories] = useState([]);
  const [fetchedPois, setFetchedPois] = useState({});
  
  // Results
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedYear, setSubmittedYear] = useState(null);
  
  // Fetch location data on mount
  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // Fetch schools
    fetch(`${API_URL}/locations/schools`)
      .then(res => res.json())
      .then(data => {
        if (data.schools) {
          setFetchedSchools(data.schools.map(s => s.name));
        }
      })
      .catch(err => console.log('Could not fetch schools:', err));
    
    // Fetch work areas
    fetch(`${API_URL}/locations/work-areas`)
      .then(res => res.json())
      .then(data => {
        if (data.work_areas) {
          setFetchedWorkAreas(data.work_areas.map(w => w.name));
        }
      })
      .catch(err => console.log('Could not fetch work areas:', err));
    
    // Fetch POI categories
    fetch(`${API_URL}/locations/poi-categories`)
      .then(res => res.json())
      .then(data => {
        if (data.categories) {
          setFetchedPoiCategories(data.categories);
          // Fetch POIs for each category
          data.categories.forEach(cat => {
            fetch(`${API_URL}/locations/pois/${cat.value}`)
              .then(res => res.json())
              .then(poiData => {
                if (poiData.pois) {
                  setFetchedPois(prev => ({
                    ...prev,
                    [cat.value]: poiData.pois.map(p => p.name)
                  }));
                }
              })
              .catch(err => console.log(`Could not fetch POIs for ${cat.value}:`, err));
          });
        }
      })
      .catch(err => console.log('Could not fetch POI categories:', err));
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    
    try {
      // Build request payload for the API
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
      
      // Call the backend API
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/recommend`, {
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
      
      console.log(`Found ${data.total_candidates} candidates, showing top ${data.recommendations.length}`);
      
      // Set results - response format matches UI expectations
      setRecommendations(data.recommendations);
      setSubmittedYear(targetYear);
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      alert(`Failed to get recommendations: ${error.message}`);
      setRecommendations(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${t.text} transition-colors duration-300`}>
      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-5 gap-8 overflow-visible">
          
          {/* Left: Filters (3 cols) */}
          <div className="lg:col-span-3 space-y-4 overflow-visible">
            
            {/* Section 1: Purchase Plan */}
            <Section title="Purchase Plan" icon={Icons.calendar} defaultOpen={true} isDark={isDark}>
              <div className="space-y-5">
                <div>
                  <label className={`block text-xs uppercase tracking-widest ${t.textLabel} mb-3`}>
                    Target Purchase Year
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {PREDICTION_YEARS.map(year => (
                      <button
                        key={year}
                        onClick={() => setTargetYear(year)}
                        className={`py-3 rounded-lg text-sm font-medium transition-all duration-200 ease-out transform active:scale-95 ${
                          targetYear === year
                            ? t.btnChipSelected
                            : `${t.bgInput} ${t.textSecondary} border ${t.border} hover:${t.borderHover} hover:${t.text}`
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
                  isDark={isDark}
                />
              </div>
            </Section>

            {/* Section 2: Property Criteria */}
            <Section title="Property Criteria" icon={Icons.home} defaultOpen={true} isDark={isDark}>
              <ChipSelect
                label="Preferred Towns"
                options={HDB_TOWNS}
                selected={towns}
                onChange={setTowns}
                maxShow={10}
                isDark={isDark}
              />
              
              <ChipSelect
                label="Flat Type"
                options={FLAT_TYPES}
                selected={flatTypes}
                onChange={setFlatTypes}
                maxShow={10}
                isDark={isDark}
              />
              
              <ChipSelect
                label="Flat Model (Optional)"
                options={FLAT_MODELS}
                selected={flatModels}
                onChange={setFlatModels}
                maxShow={6}
                isDark={isDark}
              />
              
              <RangeSlider
                label="Floor Area"
                min={35}
                max={180}
                step={5}
                values={floorArea}
                onChange={setFloorArea}
                unit=" sqm"
                isDark={isDark}
              />
              
              <ChipSelect
                label="Storey Range (Optional)"
                options={STOREY_RANGES}
                selected={storeyRanges}
                onChange={setStoreyRanges}
                maxShow={6}
                isDark={isDark}
              />
              
              <RangeSlider
                label="Remaining Lease Range"
                min={0}
                max={95}
                step={1}
                values={leaseRange}
                onChange={setLeaseRange}
                formatValue={(v) => `${v} yrs`}
                isDark={isDark}
              />
            </Section>

            {/* Section 3: Frequent Destinations (Optional) */}
            <Section title="Frequent Destinations" icon={Icons.map} defaultOpen={true} isDark={isDark}>
              <p className={`text-xs ${t.textSecondary} mb-4`}>
                Add locations you visit frequently. We'll find flats convenient to these places. All fields are optional.
              </p>
              
              <WorkLocationsSection 
                entries={workLocations} 
                onChange={setWorkLocations}
                isDark={isDark}
                workAreas={fetchedWorkAreas}
              />
              
              <SchoolLocationsSection 
                entries={schoolLocations} 
                onChange={setSchoolLocations}
                isDark={isDark}
                schools={fetchedSchools}
              />
              
              <ParentsHomesSection 
                entries={parentsHomes} 
                onChange={setParentsHomes}
                isDark={isDark}
              />
              
              <OtherDestinationsSection 
                entries={otherDestinations} 
                onChange={setOtherDestinations}
                isDark={isDark}
              />
            </Section>

            {/* Section 4: Amenity Proximity */}
            <Section title="Amenity Proximity" icon={Icons.mapPin} defaultOpen={true} isDark={isDark}>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-gray-500'} mb-4`}>
                Toggle to set maximum distance limits, or leave as "Any distance" for no constraint.
              </p>
              
              <OptionalSlider
                label="Max Distance to MRT"
                value={maxMrt}
                onChange={setMaxMrt}
                min={0.3}
                max={2.0}
                step={0.1}
                unit=" km"
                isDark={isDark}
                defaultValue={0.8}
              />
              
              <OptionalSlider
                label="Max Distance to Primary School"
                value={maxSchool}
                onChange={setMaxSchool}
                min={0.3}
                max={1.0}
                step={0.1}
                unit=" km"
                isDark={isDark}
                defaultValue={0.5}
              />
              
              <OptionalSlider
                label="Max Distance to Shopping Mall"
                value={maxMall}
                onChange={setMaxMall}
                min={0.3}
                max={3.0}
                step={0.1}
                unit=" km"
                isDark={isDark}
                defaultValue={1.0}
              />
              
              <OptionalSlider
                label="Max Distance to Hawker Center"
                value={maxHawker}
                onChange={setMaxHawker}
                min={0.3}
                max={2.0}
                step={0.1}
                unit=" km"
                isDark={isDark}
                defaultValue={0.8}
              />
            </Section>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className={`relative z-0 w-full py-4 ${t.btnPrimary} rounded-xl font-semibold text-lg
                       transition-all duration-300 ease-out
                       hover:shadow-xl hover:-translate-y-0.5
                       active:translate-y-0 active:shadow-lg
                       disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none
                       shadow-lg`}
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
              <h2 className={`text-lg font-medium mb-4 flex items-center gap-2 ${t.text}`}>
                Recommendations
                {recommendations && (
                  <span className={`text-xs font-normal ${t.textSecondary}`}>
                    for {submittedYear}
                  </span>
                )}
              </h2>
              
              {!recommendations ? (
                <div className={`border border-dashed ${t.borderDashed} rounded-xl p-10 text-center`}>
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${t.bgEmpty} flex items-center justify-center ${t.textMuted}`}>
                    {Icons.search}
                  </div>
                  <p className={`${t.textSecondary} text-sm`}>
                    Set your preferences and click<br />"Find Recommendations"
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results */}
                  {recommendations.map((rec, i) => (
                    <RecommendationCard key={rec.id} rec={rec} rank={i + 1} isDark={isDark} />
                  ))}
                  
                  {/* Disclaimer */}
                  <p className={`text-xs ${t.textSecondary} text-center pt-4`}>
                    Prices are ML predictions for {submittedYear}. Actual prices may vary.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t ${t.border} mt-10 transition-colors duration-300`}>
        <div className={`max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-3 text-xs ${t.textMuted}`}>
          <span>Based on 217K+ HDB transactions & ML price predictions</span>
          <span>Data Minions • SUTD Production Ready ML</span>
        </div>
      </footer>
    </div>
  );
}