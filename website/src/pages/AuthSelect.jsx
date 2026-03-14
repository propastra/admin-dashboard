import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import './AuthSelect.css';

const AuthSelect = () => {
    const navigate = useNavigate();

    return (
        <div className="auth-select-page">
            <div className="auth-card">
                <img src="/images/PROPASTRA%20P%20.png" alt="Propastra" className="auth-logo" />

                <h1 className="auth-title">Ready to explore?</h1>
                <p className="auth-subtitle">Sign in to find your dream home</p>

                <div className="auth-buttons">
                    <button
                        className="auth-btn auth-btn-email"
                        onClick={() => navigate('/auth/login')}
                    >
                        <Mail size={20} />
                        Continue with Email
                    </button>

                    <button
                        className="auth-btn auth-btn-outline"
                        onClick={() => navigate('/auth/mobile')}
                    >
                        <Phone size={20} />
                        Continue with Mobile
                    </button>
                </div>

                <p className="auth-footer">
                    Don't have an account? <a href="/auth/register" onClick={(e) => { e.preventDefault(); navigate('/auth/register'); }}>Register</a>
                </p>
            </div>
        </div>
    );
};

export default AuthSelect;
