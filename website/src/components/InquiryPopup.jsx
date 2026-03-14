import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { submitInquiry } from '../services/api';
import { useInquiryPopup } from '../context/InquiryPopupContext';
import { useAuth } from '../context/AuthContext';
import './InquiryPopup.css';

const InquiryPopup = () => {
    const { login } = useAuth();
    const { showPopup, closePopup, runPendingAndClose, contextMessage, propertyId } = useInquiryPopup();
    const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            setError('Name is required');
            return;
        }
        if (!form.phone.trim()) {
            setError('Mobile number is required');
            return;
        }
        setError('');
        setSending(true);
        try {
            const res = await submitInquiry({
                name: form.name.trim(),
                phone: form.phone.trim(),
                email: form.email.trim() || undefined,
                message: form.message.trim() || undefined,
                propertyId: propertyId || undefined,
            });
            
            // Auto login if token returned
            if (res.data && res.data.token && res.data.user) {
                login(res.data.token, res.data.user);
                // Mark first visit done permanently so popup never shows again
                localStorage.setItem('inquiry_first_visit_shown', '1');
            }

            setSent(true);
            setTimeout(() => {
                setSent(false);
                setForm({ name: '', phone: '', email: '', message: '' });
                runPendingAndClose();
            }, 1500);
        } catch (err) {
            console.error('Inquiry submission error:', err);
            setError(err.response?.data?.message || 'Failed to submit. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setError('');
        setForm({ name: '', phone: '', email: '', message: '' });
        setSent(false);
        closePopup();
    };

    if (!showPopup) return null;

    return (
        <div className="inquiry-popup-overlay" onClick={handleClose}>
            <div className="inquiry-popup-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="inquiry-popup-close" onClick={handleClose} aria-label="Close">
                    <X size={22} />
                </button>

                {sent ? (
                    <div className="inquiry-popup-success">
                        <Check size={48} color="var(--accent)" />
                        <h3>Submitted!</h3>
                        <p>We'll get back to you soon. Opening your selection...</p>
                    </div>
                ) : (
                    <>
                        <h3 className="inquiry-popup-title">Get in touch</h3>
                        {contextMessage && <p className="inquiry-popup-for">{contextMessage}</p>}
                        <form onSubmit={handleSubmit} className="inquiry-popup-form">
                            <div className="inquiry-popup-group">
                                <label>Name <span className="required">*</span></label>
                                <input
                                    type="text"
                                    placeholder="Your name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="inquiry-popup-group">
                                <label>Mobile number <span className="required">*</span></label>
                                <input
                                    type="tel"
                                    placeholder="Your mobile number"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="inquiry-popup-group">
                                <label>Email ID</label>
                                <input
                                    type="email"
                                    placeholder="Your email (optional)"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>
                            <div className="inquiry-popup-group">
                                <label>Message</label>
                                <textarea
                                    placeholder="Your message (optional)"
                                    rows={3}
                                    value={form.message}
                                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                                />
                            </div>
                            {error && <p className="inquiry-popup-error">{error}</p>}
                            <button type="submit" className="inquiry-popup-submit" disabled={sending}>
                                {sending ? 'Submitting...' : 'Submit'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default React.memo(InquiryPopup);
