import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import { useAuth } from '../context/AuthContext';
import './TopNav.css';

const TopNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { ensureIdentified } = useInquiryPopup();
    const { user, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { to: '/', label: 'Home' },
        { to: '/search', label: 'Properties' },
        { to: '/map', label: 'Map' },
        { to: '/favorites', label: 'Favorites' }
    ];

    const handleNavClick = (to, label) => {
        if (to === '/') {
            navigate('/');
            return;
        }

        if (user) {
            navigate(to);
            return;
        }

        ensureIdentified(() => {
            navigate(to);
        }, `To see ${label}, we'd love to know you better`);
    };

    return (
        <nav className={`top-nav ${scrolled ? 'scrolled' : ''}`}>
            <div className="top-nav-container container" style={{ justifyContent: 'center' }}>
                {/* Main Links Only */}
                <ul className="top-nav-links">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
                        return (
                            <li key={item.to}>
                                <button 
                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                    onClick={() => handleNavClick(item.to, item.label)}
                                >
                                    {item.label}
                                    {isActive && <span className="active-indicator"></span>}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
};

export default React.memo(TopNav);
