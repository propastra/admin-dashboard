import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Heart, User, MapPin } from 'lucide-react';
import './BottomNav.css';

const BottomNav = () => {
    const navItems = [
        { to: '/', icon: Home, label: 'Home' },
        { to: '/search', icon: Search, label: 'Search' },
        { to: '/map', icon: MapPin, label: 'Map' },
        { to: '/favorites', icon: Heart, label: 'Favorites' },
        { to: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
                >
                    <item.icon size={22} />
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
