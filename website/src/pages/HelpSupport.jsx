import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, LifeBuoy, MessageCircle, CheckCircle } from 'lucide-react';
import { submitInquiry } from '../services/api';
import './HelpSupport.css';

const faqs = [
    {
        question: 'How can I change my selected city?',
        answer: 'Go to the Profile page and select "Change City". You can choose a new city from the available list.'
    },
    {
        question: 'How do I save a property to favorites?',
        answer: 'On any property card, click the heart icon to add it to your favorites list.'
    },
    {
        question: 'How can I contact the support team?',
        answer: 'You can use the contact form below, email support@propastra.com, or call +91 98765 43210.'
    },
    {
        question: 'Where can I view my inquiries?',
        answer: 'Your property inquiries will be visible in the support section once submitted, and we will also email you updates if you provide your email address.'
    }
];

const HELP_MESSAGES_KEY = 'helpSupportMessages';

const HelpSupport = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [recentMessages, setRecentMessages] = useState([]);

    useEffect(() => {
        const saved = window.localStorage.getItem(HELP_MESSAGES_KEY);
        if (saved) {
            try {
                setRecentMessages(JSON.parse(saved));
            } catch (err) {
                console.error('Failed to parse stored help messages:', err);
            }
        }
    }, []);

    const saveLocalMessage = (message) => {
        const next = [message, ...recentMessages].slice(0, 10);
        setRecentMessages(next);
        window.localStorage.setItem(HELP_MESSAGES_KEY, JSON.stringify(next));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!formData.name || formData.name.trim().length < 2 || !nameRegex.test(formData.name.trim())) {
            setStatus({ type: 'error', message: 'Please enter a valid name (alphabets only).' });
            return;
        }
        const phoneRegex = /^\d{10}$/;
        if (!formData.phone || !phoneRegex.test(formData.phone.replace(/[\s-]/g, ''))) {
            setStatus({ type: 'error', message: 'Please enter a valid 10-digit mobile number.' });
            return;
        }
        if (formData.email && formData.email.trim()) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(formData.email.trim())) {
                setStatus({ type: 'error', message: 'Please enter a valid email address.' });
                return;
            }
        }
        if (!formData.message || formData.message.trim().length < 5) {
            setStatus({ type: 'error', message: 'Please enter a valid message.' });
            return;
        }
        setSubmitting(true);
        setStatus({ type: '', message: '' });
        try {
            await submitInquiry({
                name: formData.name,
                email: formData.email || undefined,
                phone: formData.phone,
                message: formData.message,
                propertyId: null
            });
            const now = new Date().toISOString();
            saveLocalMessage({
                id: now,
                createdAt: now,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                message: formData.message
            });
            setStatus({ type: 'success', message: 'Your request has been submitted. Our support team will contact you shortly.' });
            setFormData({ name: '', email: '', phone: '', message: '' });
        } catch (err) {
            console.error('Help submit error:', err);
            setStatus({ type: 'error', message: 'There was an issue submitting your request. Please try again later.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="help-page">
            <div className="help-header">
                <button className="help-back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                </button>
                <h1>Help & Support</h1>
            </div>

            <div className="help-intro-card">
                <div>
                    <p className="help-subtitle">Need assistance?</p>
                    <h2>We’re here to help you with your property search and account.</h2>
                </div>
                <div className="help-icon-wrap">
                    <LifeBuoy size={32} />
                </div>
            </div>

            <div className="help-contact-grid">
                <div className="help-contact-card">
                    <div className="help-contact-icon"><Mail size={20} /></div>
                    <div>
                        <p className="help-contact-label">Email Support</p>
                        <a href="mailto:support@propastra.com">support@propastra.com</a>
                    </div>
                </div>
                <div className="help-contact-card">
                    <div className="help-contact-icon"><Phone size={20} /></div>
                    <div>
                        <p className="help-contact-label">Phone</p>
                        <a href="tel:+919876543210">+91 98765 43210</a>
                    </div>
                </div>
                <div className="help-contact-card full-width">
                    <div className="help-contact-icon"><MessageCircle size={20} /></div>
                    <div>
                        <p className="help-contact-label">Support Hours</p>
                        <span>Mon - Sat, 9:00 AM to 7:00 PM IST</span>
                    </div>
                </div>
            </div>

            {recentMessages.length > 0 && (
                <div className="help-history-section">
                    <div className="help-section-title">
                        <h3>Your recent support requests</h3>
                        <p>Review the messages you have sent previously from this browser.</p>
                    </div>
                    <div className="help-history-list">
                        {recentMessages.map((item) => (
                            <div className="help-history-item" key={item.id}>
                                <div className="help-history-meta">
                                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                                    {item.email && <span>{item.email}</span>}
                                </div>
                                <div className="help-history-message">{item.message}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="help-form-section">
                <div className="help-section-title">
                    <h3>Send us a message</h3>
                    <p>Fill in your details and we’ll get back to you as soon as possible.</p>
                </div>
                <form className="help-form" onSubmit={handleSubmit}>
                    <div className="input-row">
                        <label>
                            Name<span>*</span>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Your name"
                            />
                        </label>
                        <label>
                            Phone<span>*</span>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Mobile number"
                            />
                        </label>
                    </div>
                    <label>
                        Email
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Email address"
                        />
                    </label>
                    <label>
                        Message<span>*</span>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="How can we help you?"
                            rows={5}
                        />
                    </label>
                    {status.message && (
                        <div className={`help-status ${status.type}`}>{status.message}</div>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Sending...' : 'Submit Request'}
                    </button>
                </form>
            </div>

            <div className="help-faq-section">
                <div className="help-section-title">
                    <h3>Frequently Asked Questions</h3>
                    <p>Quick answers to the most common questions.</p>
                </div>
                <div className="help-faq-list">
                    {faqs.map((item, index) => (
                        <div className="help-faq-item" key={index}>
                            <div className="help-faq-question">
                                <span>{index + 1}</span>
                                <h4>{item.question}</h4>
                            </div>
                            <p>{item.answer}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="help-footer-note">
                <CheckCircle size={18} />
                <span>All support requests are handled by our experienced team. Expect a response within 24 hours.</span>
            </div>
        </div>
    );
};

export default HelpSupport;
