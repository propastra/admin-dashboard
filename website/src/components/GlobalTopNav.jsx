import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const GlobalTopNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isHome = location.pathname === '/';
    const isAuth = location.pathname.startsWith('/auth');

    if (isAuth) return null;

    // We make it sticky or fixed? Let's use fixed and add global padding-top to body on non-home pages
    useEffect(() => {
        if (!isHome && !isAuth) {
            document.body.style.paddingTop = '60px';
            const searchBar = document.querySelector('.search-top-bar');
            if(searchBar) searchBar.style.top = '60px';
        } else {
            document.body.style.paddingTop = '0px';
        }
        return () => { document.body.style.paddingTop = '0px'; };
    }, [isHome, isAuth, location.pathname]);

    if (isHome) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: '60px',
                background: 'rgba(30, 33, 80, 0.95)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                zIndex: 10000,
                transition: 'transform 0.3s ease, opacity 0.3s ease',
                transform: scrolled ? 'translateY(0)' : 'translateY(-100%)',
                opacity: scrolled ? 1 : 0,
                pointerEvents: scrolled ? 'auto' : 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <img 
                    src="/images/header-logo.png" 
                    alt="PropAstra" 
                    style={{ height: '32px', cursor: 'pointer' }}
                    onClick={() => {
                        window.scrollTo(0,0);
                        navigate('/');
                    }}
                />
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '60px',
            background: 'var(--gradient-hero)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            zIndex: 10000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
            <img 
                src="/images/header-logo.png" 
                alt="PropAstra" 
                style={{ height: '32px', cursor: 'pointer' }}
                onClick={() => navigate('/')}
            />
        </div>
    );
};

export default GlobalTopNav;
