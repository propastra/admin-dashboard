// f:\Propastra\admin-dashboard\website\src\components\Header.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ChevronRight, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import './Header.css';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { selectedCity } = useCity();
    const { ensureIdentified } = useInquiryPopup();
    
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close menu purely on route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);
    
    // Transparent on Home page since Home has its own continuous gradient hero background
    const isHome = location.pathname === '/';

    return (
        <header className={`global-header ${isHome ? 'home-transparent' : 'gradient'}`}>
            <div className="header-container container">
                <div className="header-left">
                    <img 
                        src="/images/header-logo.png" 
                        alt="PropAstra Logo" 
                        className="header-logo-img" 
                        onClick={() => navigate('/')}
                        fetchpriority="high" 
                        decoding="async" 
                        style={{ cursor: 'pointer' }}
                    />
                </div>
                
                {/* Integrated Navigation Links */}
                <ul className="header-nav-links">
                    <li><button onClick={() => navigate('/')} className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</button></li>
                    <li><button onClick={() => ensureIdentified(() => navigate('/search'), "To see properties")} className={`nav-link ${location.pathname.startsWith('/search') ? 'active' : ''}`}>Properties</button></li>
                    <li><button onClick={() => ensureIdentified(() => navigate('/map'), "To use the map")} className={`nav-link ${location.pathname.startsWith('/map') ? 'active' : ''}`}>Map</button></li>
                    <li><button onClick={() => {
                        if (user) navigate('/favorites');
                        else ensureIdentified(() => navigate('/favorites'), 'Sign in to see your shortlisted properties');
                    }} className={`nav-link ${location.pathname.startsWith('/favorites') ? 'active' : ''}`}>Shortlisted</button></li>
                </ul>

                <div className="header-right">
                    <div className="header-location" onClick={() => navigate('/city')}>
                        <div className="location-icon-wrap">
                            <MapPin size={18} />
                        </div>
                        <div className="location-text-wrap">
                            <span className="location-label">Location</span>
                            <span className="location-city">{selectedCity || 'Select City'} <ChevronRight size={14} /></span>
                        </div>
                    </div>
                    <button
                        className="avatar-btn"
                        onClick={() => {
                            if (window.matchMedia("(max-width: 768px)").matches) {
                                setIsMobileMenuOpen(!isMobileMenuOpen);
                            } else {
                                if (user) navigate('/profile');
                                else ensureIdentified(() => navigate('/profile'), 'Sign in to see your profile');
                            }
                        }}
                    >
                        {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="user-avatar-img" />
                        ) : (
                            user ? user.name?.charAt(0).toUpperCase() : <img src="/images/PROPASTRA%20P%20.png" alt="P" className="user-avatar-img" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="mobile-menu-dropdown">
                    <div className="mobile-menu-header">
                        <div className="mobile-location" onClick={() => { setIsMobileMenuOpen(false); navigate('/city'); }}>
                            <MapPin size={18} />
                            <span>{selectedCity || 'Select City'}</span>
                            <ChevronRight size={14} style={{ marginLeft: '4px' }} />
                        </div>
                        <button className="mobile-close-btn" onClick={() => setIsMobileMenuOpen(false)}>
                            <X size={24} />
                        </button>
                    </div>
                    <ul className="mobile-menu-links">
                        <li><button onClick={() => { setIsMobileMenuOpen(false); navigate('/'); }}>Home</button></li>
                        <li><button onClick={() => { setIsMobileMenuOpen(false); ensureIdentified(() => navigate('/search'), "To see properties"); }}>Properties</button></li>
                        <li><button onClick={() => { setIsMobileMenuOpen(false); ensureIdentified(() => navigate('/map'), "To use the map"); }}>Map</button></li>
                        <li><button onClick={() => {
                            setIsMobileMenuOpen(false);
                            if (user) navigate('/favorites');
                            else ensureIdentified(() => navigate('/favorites'), 'Sign in to see your shortlisted properties');
                        }}>Shortlisted</button></li>
                        
                        <li className="mobile-menu-divider"></li>
                        
                        <li>
                            <button className="mobile-profile-action" onClick={() => {
                                setIsMobileMenuOpen(false);
                                if (user) navigate('/profile');
                                else ensureIdentified(() => navigate('/profile'), 'Sign in to see your profile');
                            }}>
                                <User size={18} style={{ marginRight: '8px' }} />
                                {user ? 'My Profile' : 'Sign In'}
                            </button>
                        </li>
                    </ul>
                </div>
            )}
        </header>
    );
};

export default React.memo(Header);
