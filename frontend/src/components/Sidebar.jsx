import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBuilding, FaUsers, FaSignOutAlt, FaPlus, FaEnvelope } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const linkStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        color: isActive(path) ? '#fff' : '#cbd5e1',
        backgroundColor: isActive(path) ? 'rgba(255,255,255,0.1)' : 'transparent',
        textDecoration: 'none',
        marginBottom: '5px',
        borderRadius: '6px',
        transition: 'all 0.2s',
    });

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`sidebar-overlay ${isOpen ? 'active' : ''}`}
                onClick={toggleSidebar}
            ></div>

            {/* Sidebar */}
            <div style={{
                width: '250px',
                backgroundColor: '#1e293b',
                color: 'white',
                height: '100vh',
                position: 'fixed',
                left: 0,
                top: 0,
                display: 'flex',
                flexDirection: 'column',
                zIndex: 50,
                transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease-in-out'
            }}>
                <div style={{ padding: '20px', fontSize: '20px', fontWeight: 'bold', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Propastra_admin
                    {/* Close button for mobile */}
                    <button className="hamburger-btn" style={{ display: window.innerWidth <= 768 ? 'block' : 'none', color: '#cbd5e1', fontSize: '20px' }} onClick={toggleSidebar}>
                        ✕
                    </button>
                </div>
                <nav style={{ flex: 1, padding: '20px 10px' }}>
                    <Link to="/" style={linkStyle('/')} onClick={() => window.innerWidth <= 768 && toggleSidebar()}>
                        <FaHome style={{ marginRight: '10px' }} /> Dashboard
                    </Link>
                    <Link to="/properties" style={linkStyle('/properties')}>
                        <FaBuilding style={{ marginRight: '10px' }} /> Properties
                    </Link>
                    <Link to="/visitors" style={linkStyle('/visitors')}>
                        <FaUsers style={{ marginRight: '10px' }} /> Visitors
                    </Link>
                    <Link to="/inquiries" style={linkStyle('/inquiries')}>
                        <FaEnvelope style={{ marginRight: '10px' }} /> Inquiries
                    </Link>
                </nav>
                <div style={{ padding: '20px', borderTop: '1px solid #334155' }}>
                    <button
                        onClick={logout}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            padding: '10px',
                            fontSize: '16px'
                        }}
                    >
                        <FaSignOutAlt style={{ marginRight: '10px' }} /> Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
