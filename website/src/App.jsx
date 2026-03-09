import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
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
import InquiryPopup from './components/InquiryPopup';
import { useHeartbeat } from './hooks/useHeartbeat';
import { useAuth } from './context/AuthContext';
import { useInquiryPopup } from './context/InquiryPopupContext';

function App() {
  const location = useLocation();
  const showBottomNav = !location.pathname.startsWith('/auth');
  const isMainSite = !location.pathname.startsWith('/auth');
  const { user, loading } = useAuth();
  const { showFirstVisitPopup } = useInquiryPopup();
  const navigate = useNavigate();

  // Analytics heartbeat
  useHeartbeat();

  // First visit: show inquiry popup ONCE when user first opens the website.
  // IMPORTANT: Only run this once on mount, not on every user state change.
  // We read the token directly to avoid triggering on the brief null->user transition after login.
  useEffect(() => {
    if (!loading && isMainSite) {
      // Pass null if we have a token (even if user object hasn't loaded yet), so popup doesn't show
      const hasToken = !!localStorage.getItem('website_token');
      showFirstVisitPopup(hasToken ? { id: 'pending' } : null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, isMainSite]); // Only run when loading state settles — NOT on user changes

  // Guard: if user tries to access protected pages directly without being logged in.
  // Wait until auth loading is complete before making any redirect decisions.
  useEffect(() => {
    if (loading) return; // Don't redirect while loading

    const protectedPaths = ['/search', '/map', '/favorites', '/profile', '/property/'];
    const isProtected = protectedPaths.some(path => location.pathname.startsWith(path));
    const hasToken = !!localStorage.getItem('website_token');
    
    if (isMainSite && isProtected && !user && !hasToken) {
      // Only redirect if we are sure there is no token AND user is not logged in
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user, loading, isMainSite, navigate]);

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
      {isMainSite && <InquiryPopup />}
    </>
  );
}

export default App;
