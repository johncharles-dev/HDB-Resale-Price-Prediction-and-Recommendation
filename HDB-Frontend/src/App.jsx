import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useState } from 'react';
import HDBPrediction from './components/Hdbprediction.jsx';
import HDBRecommendation from './components/Hdbrecommendation.jsx';

function App() {
  const [isDark, setIsDark] = useState(false);

  return (
    <Router>
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        {/* Navigation */}
        <nav className={`border-b transition-colors duration-300 ${
          isDark 
            ? 'bg-neutral-900 border-neutral-800' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                  isDark ? 'bg-white' : 'bg-gray-900'
                }`}>
                  <span className={`font-bold text-sm ${isDark ? 'text-black' : 'text-white'}`}>H</span>
                </div>
                <span className={`font-medium transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  HDB Price Advisor
                </span>
              </div>
              
              {/* Nav Links + Theme Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <NavLink 
                    to="/" 
                    className={({ isActive }) => 
                      `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isActive 
                          ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                          : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                      }`
                    }
                  >
                    Price Prediction
                  </NavLink>
                  <NavLink 
                    to="/recommend" 
                    className={({ isActive }) => 
                      `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                        isActive 
                          ? (isDark ? 'bg-white text-black' : 'bg-gray-900 text-white')
                          : (isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100')
                      }`
                    }
                  >
                    Find HDB
                  </NavLink>
                </div>
                
                {/* Theme Toggle */}
                <button
                  onClick={() => setIsDark(!isDark)}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    isDark 
                      ? 'bg-neutral-800 text-yellow-400 hover:bg-neutral-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDark ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes - pass isDark prop */}
        <Routes>
          <Route path="/" element={<HDBPrediction isDark={isDark} />} />
          <Route path="/recommend" element={<HDBRecommendation isDark={isDark} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;