import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AuthSelect from './pages/AuthSelect';
import Login from './pages/Login';
import MobileLogin from './pages/MobileLogin';
import Register from './pages/Register';
import CitySelect from './pages/CitySelect';
import Home from './pages/Home';
import PropertyDetail from './pages/PropertyDetail';
import SearchPage from './pages/SearchPage';
import MapExplorer from './pages/MapExplorer';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import AgentDashboard from './pages/AgentDashboard';
import BottomNav from './components/BottomNav';
import { useHeartbeat } from './hooks/useHeartbeat';

function App() {
  const location = useLocation();
  const showBottomNav = !location.pathname.startsWith('/auth');

  // Analytics heartbeat
  useHeartbeat();

  return (
    <>
      <Routes>
        {/* Auth Pages */}
        <Route path="/auth" element={<AuthSelect />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/mobile" element={<MobileLogin />} />
        <Route path="/auth/register" element={<Register />} />

        {/* City Selection */}
        <Route path="/city" element={<CitySelect />} />

        {/* Main Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/map" element={<MapExplorer />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/agent-dashboard" element={<AgentDashboard />} />
      </Routes>

      {showBottomNav && <BottomNav />}
    </>
  );
}

export default App;
