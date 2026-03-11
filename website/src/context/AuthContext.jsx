import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('website_token'));
    // Track if login() just set the user so we don't redundantly re-fetch
    const justLoggedInRef = useRef(false);

    useEffect(() => {
        if (token) {
            if (justLoggedInRef.current) {
                // login() already set the user — no need to re-fetch
                justLoggedInRef.current = false;
                setLoading(false);
            } else {
                loadUser();
            }
        } else {
            setUser(null);
            setLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        setLoading(true); // Always signal loading before async call
        try {
            const res = await getMe();
            setUser(res.data);
        } catch (err) {
            console.error('Auth error:', err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                localStorage.removeItem('website_token');
                setToken(null);
                setUser(null);
            }
            // On network errors, keep existing user/token — don't log out
        } finally {
            setLoading(false);
        }
    };

    const login = (tokenValue, userData) => {
        justLoggedInRef.current = true; // Skip re-fetch in useEffect
        localStorage.setItem('website_token', tokenValue);
        setUser(userData); // Set user FIRST before token to prevent route guard flash
        setToken(tokenValue);
        setLoading(false); // Make sure loading is false so protected routes work immediately
    };

    const logout = () => {
        localStorage.removeItem('website_token');
        localStorage.removeItem('selectedCity');
        localStorage.removeItem('active_category');
        localStorage.removeItem('buy_listing_type');
        localStorage.removeItem('invest_submitted');
        localStorage.removeItem('inquiry_first_visit_shown');
        setToken(null);
        setUser(null);
        setLoading(false);
    };

    return (
        <AuthContext.Provider value={{ user, loading, token, login, logout, loadUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
