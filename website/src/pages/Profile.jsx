import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, LogOut, ChevronRight, Settings, HelpCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCity } from '../context/CityContext';
import { updateProfile } from '../services/api';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { selectedCity } = useCity();
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        city: user?.city || selectedCity || '',
    });

    if (!user) {
        return (
            <div className="profile-page">
                <div className="profile-empty">
                    <User size={64} color="var(--gray-300)" />
                    <h2>Welcome!</h2>
                    <p>Sign in to manage your account</p>
                    <button className="btn btn-primary" onClick={() => navigate('/auth')}>
                        Sign In
                    </button>
                </div>
                <div style={{ height: '80px' }} />
            </div>
        );
    }

    const handleSave = async () => {
        try {
            await updateProfile(formData);
            setEditing(false);
        } catch (err) {
            console.error('Failed to update profile:', err);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="profile-page">
            <div className="profile-top">
                <button className="search-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1>Profile</h1>
            </div>

            <div className="profile-card">
                <div className="profile-avatar">
                    <User size={32} />
                </div>
                <h2 className="profile-name">{user.name}</h2>
                <p className="profile-email">{user.email}</p>
            </div>

            {editing ? (
                <div className="profile-edit-form">
                    <div className="input-group">
                        <label>Name</label>
                        <div className="input-field">
                            <User size={18} className="icon" />
                            <input type="text" value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Phone</label>
                        <div className="input-field">
                            <Phone size={18} className="icon" />
                            <input type="tel" value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label>City</label>
                        <div className="input-field">
                            <MapPin size={18} className="icon" />
                            <input type="text" value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                        </div>
                    </div>
                    <div className="profile-edit-actions">
                        <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave}>Save</button>
                    </div>
                </div>
            ) : (
                <div className="profile-menu">
                    <button className="profile-menu-item" onClick={() => setEditing(true)}>
                        <div className="menu-item-left">
                            <Settings size={20} />
                            <span>Edit Profile</span>
                        </div>
                        <ChevronRight size={18} />
                    </button>
                    {user?.role === 'Agent' && (
                        <button className="profile-menu-item" onClick={() => navigate('/agent-dashboard')}>
                            <div className="menu-item-left">
                                <LogOut size={20} style={{ transform: 'rotate(180deg)' }} /> {/* Temporary icon */}
                                <span>Agent Dashboard</span>
                            </div>
                            <ChevronRight size={18} />
                        </button>
                    )}
                    <button className="profile-menu-item" onClick={() => navigate('/favorites')}>
                        <div className="menu-item-left">
                            <User size={20} />
                            <span>My Favorites</span>
                        </div>
                        <ChevronRight size={18} />
                    </button>
                    <button className="profile-menu-item" onClick={() => navigate('/city')}>
                        <div className="menu-item-left">
                            <MapPin size={20} />
                            <span>Change City</span>
                        </div>
                        <ChevronRight size={18} />
                    </button>
                    <button className="profile-menu-item" onClick={() => { }}>
                        <div className="menu-item-left">
                            <HelpCircle size={20} />
                            <span>Help & Support</span>
                        </div>
                        <ChevronRight size={18} />
                    </button>
                    <button className="profile-menu-item danger" onClick={handleLogout}>
                        <div className="menu-item-left">
                            <LogOut size={20} />
                            <span>Logout</span>
                        </div>
                    </button>
                </div>
            )}

            <div style={{ height: '80px' }} />
        </div>
    );
};

export default Profile;
