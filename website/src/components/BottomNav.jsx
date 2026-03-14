import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, MapPin } from 'lucide-react';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import { useAuth } from '../context/AuthContext';
import './BottomNav.css';

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { ensureIdentified } = useInquiryPopup();
    const { user } = useAuth();

    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/search', icon: Search, label: 'Search' },
        { to: '/map', icon: MapPin, label: 'Map' },
        { to: '/favorites', icon: Heart, label: 'Favorites' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    const handleNavClick = (to, label) => {
        // Home is always accessible for first-visit popup triggers
        if (to === '/') {
            navigate('/');
            return;
        }

        // If logged in, proceed
        if (user) {
            navigate(to);
            return;
        }

        // Otherwise, ensure identified
        ensureIdentified(() => {
            navigate(to);
        }, `To see ${label}, we'd love to know you better`);
    };

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                return (
                    <button
                        key={item.to}
                        onClick={() => handleNavClick(item.to, item.label)}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        <item.icon size={22} />
                        <span>{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default React.memo(BottomNav);
