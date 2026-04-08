import React, { useState } from 'react';
import { Mail, Phone, User, X, Send } from 'lucide-react';
import { submitInquiry } from '../services/api';
import './RightSidebar.css';

const RightSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: 'Right Sidebar Inquiry' });
    const [status, setStatus] = useState('idle');

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await submitInquiry(formData);
            setStatus('success');
            setTimeout(() => {
                setIsOpen(false);
                setStatus('idle');
                setFormData({ name: '', phone: '', email: '', message: 'Right Sidebar Inquiry' });
            }, 3000);
        } catch (err) {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    };

    return (
        <>
            {/* The Dropdown / Slideout Panel Container */}
            <div className={`right-sidebar-container ${isOpen ? 'open' : ''}`}>
                
                {/* The Tab Button that sits on the right edge */}
                <button className="sidebar-tab" onClick={toggleSidebar}>
                    {isOpen ? <X size={20} /> : <span className="tab-text">Enquire Now</span>}
                </button>

                <div className="sidebar-panel">
                    <div className="sidebar-header">
                        <h3>Get in Touch</h3>
                        <p>Drop your details, we'll reply shortly!</p>
                    </div>
                    
                    <div className="sidebar-content">
                        {status === 'success' ? (
                            <div className="sidebar-success">
                                <div className="success-icon">✓</div>
                                <p>Thanks for reaching out! Our expert team will contact you shortly.</p>
                            </div>
                        ) : (
                            <form className="sidebar-form" onSubmit={handleSubmit}>
                                <div className="sidebar-input-group">
                                    <div className="sidebar-input-icon"><User size={16} /></div>
                                    <input 
                                        required 
                                        type="text" 
                                        placeholder="Full Name" 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})} 
                                    />
                                </div>
                                <div className="sidebar-input-group">
                                    <div className="sidebar-input-icon"><Phone size={16} /></div>
                                    <input 
                                        required 
                                        type="tel" 
                                        placeholder="Phone Number" 
                                        value={formData.phone} 
                                        onChange={e => setFormData({...formData, phone: e.target.value})} 
                                    />
                                </div>
                                <div className="sidebar-input-group">
                                    <div className="sidebar-input-icon"><Mail size={16} /></div>
                                    <input 
                                        type="email" 
                                        placeholder="Email Address (Optional)" 
                                        value={formData.email} 
                                        onChange={e => setFormData({...formData, email: e.target.value})} 
                                    />
                                </div>
                                
                                {status === 'error' && <div className="sidebar-error">Failed to send. Please try again.</div>}
                                
                                <button type="submit" className="sidebar-submit-btn" disabled={status === 'loading'}>
                                    {status === 'loading' ? 'Sending...' : <><Send size={16} /> Request Callback</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Overlay to close when clicking outside */}
            <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={() => setIsOpen(false)}></div>
        </>
    );
};

export default RightSidebar;
