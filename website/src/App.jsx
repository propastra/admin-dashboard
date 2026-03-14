import React, { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
const AuthSelect = React.lazy(() => import('./pages/AuthSelect'));
const Login = React.lazy(() => import('./pages/Login'));
const MobileLogin = React.lazy(() => import('./pages/MobileLogin'));
const Register = React.lazy(() => import('./pages/Register'));
const CitySelect = React.lazy(() => import('./pages/CitySelect'));
const Home = React.lazy(() => import('./pages/Home'));
const PropertyDetail = React.lazy(() => import('./pages/PropertyDetail'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const MapExplorer = React.lazy(() => import('./pages/MapExplorer'));
const Favorites = React.lazy(() => import('./pages/Favorites'));
const Profile = React.lazy(() => import('./pages/Profile'));
const AgentDashboard = React.lazy(() => import('./pages/AgentDashboard'));
const BottomNav = React.lazy(() => import('./components/BottomNav'));
const InquiryPopup = React.lazy(() => import('./components/InquiryPopup'));
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
    <React.Suspense fallback={<div className="loading-screen"><div className="spinner"></div></div>}>
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
    </React.Suspense>
  );
}

export default App;
