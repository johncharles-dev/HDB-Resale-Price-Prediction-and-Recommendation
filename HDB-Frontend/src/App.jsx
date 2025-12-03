import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import HDBPrediction from './components/Hdbprediction.jsx';
import HDBRecommendation from './components/Hdbrecommendation.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black">
        {/* Navigation */}
        <nav className="bg-neutral-900 border-b border-neutral-800">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-sm">H</span>
                </div>
                <span className="text-white font-medium">HDB Price Advisor</span>
              </div>
              
              {/* Nav Links */}
              <div className="flex gap-2">
                <NavLink 
                  to="/" 
                  className={({ isActive }) => 
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-white text-black' 
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`
                  }
                >
                  Price Prediction
                </NavLink>
                <NavLink 
                  to="/recommend" 
                  className={({ isActive }) => 
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-white text-black' 
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`
                  }
                >
                  Find HDB
                </NavLink>
              </div>
            </div>
          </div>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HDBPrediction />} />
          <Route path="/recommend" element={<HDBRecommendation />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;