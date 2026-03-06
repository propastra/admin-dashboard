import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Register.css';

const Register = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '', confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await registerUser({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
            });
            login(res.data.token, res.data.user);
            navigate('/city');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (key, value) => setFormData({ ...formData, [key]: value });

    return (
        <div className="register-page">
            <div className="auth-card">
                <h1 className="login-title">Create Account</h1>
                <p className="login-subtitle">Join us and find your dream home!</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>Full Name</label>
                        <div className="input-field">
                            <User size={18} className="icon" />
                            <input type="text" placeholder="Enter your name" value={formData.name}
                                onChange={(e) => updateField('name', e.target.value)} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <div className="input-field">
                            <Mail size={18} className="icon" />
                            <input type="email" placeholder="Enter your email" value={formData.email}
                                onChange={(e) => updateField('email', e.target.value)} required />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Phone</label>
                        <div className="input-field">
                            <Phone size={18} className="icon" />
                            <input type="tel" placeholder="Enter your phone number" value={formData.phone}
                                onChange={(e) => updateField('phone', e.target.value)} />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-field">
                            <Lock size={18} className="icon" />
                            <input type={showPassword ? 'text' : 'password'} placeholder="Create a password"
                                value={formData.password} onChange={(e) => updateField('password', e.target.value)} required />
                            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Confirm Password</label>
                        <div className="input-field">
                            <Lock size={18} className="icon" />
                            <input type="password" placeholder="Confirm your password"
                                value={formData.confirmPassword} onChange={(e) => updateField('confirmPassword', e.target.value)} required />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full login-btn" disabled={loading}>
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <p className="auth-footer" style={{ marginTop: '24px' }}>
                    Already have an account? <a href="/auth/login" onClick={(e) => { e.preventDefault(); navigate('/auth/login'); }}>Sign In</a>
                </p>

                <button className="back-btn" onClick={() => navigate('/auth')}>
                    <ArrowLeft size={16} /> Back
                </button>
            </div>
        </div>
    );
};

export default Register;
