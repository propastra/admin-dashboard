import React from 'react';
import { Check } from 'lucide-react';

const InquiryModal = ({ property, user, show, onClose, inquiryForm, setInquiryForm, onSubmit, inquirySent, getDisplayTitle }) => {
    if (!show) return null;

    return (
        <div className="inquiry-overlay" onClick={onClose}>
            <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
                {inquirySent ? (
                    <div className="inquiry-success">
                        <Check size={48} color="var(--accent)" />
                        <h3>Inquiry Sent!</h3>
                        <p>We'll get back to you soon</p>
                    </div>
                ) : (
                    <>
                        <h3>Send Inquiry</h3>
                        <p className="inquiry-for">About: {getDisplayTitle(property)}</p>
                        <form onSubmit={onSubmit}>
                            {!user && (
                                <>
                                    <div className="input-group">
                                        <label>Name</label>
                                        <div className="input-field">
                                            <input type="text" placeholder="Your name" required
                                                value={inquiryForm.name}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Email</label>
                                        <div className="input-field">
                                            <input type="email" placeholder="Your email" required
                                                value={inquiryForm.email}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Phone</label>
                                        <div className="input-field">
                                            <input type="tel" placeholder="Your phone" required
                                                value={inquiryForm.phone}
                                                onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })} />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="input-group">
                                <label>Message</label>
                                <div className="input-field" style={{ alignItems: 'flex-start' }}>
                                    <textarea placeholder="I'm interested in this property..."
                                        rows="3" style={{ width: '100%', resize: 'vertical', border: 'none', outline: 'none', fontFamily: 'inherit' }}
                                        value={inquiryForm.message}
                                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })} />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Schedule Site Visit (Optional)</label>
                                <div className="input-field">
                                    <input type="date"
                                        style={{ width: '100%', border: 'none', outline: 'none' }}
                                        value={inquiryForm.visitDate}
                                        onChange={(e) => setInquiryForm({ ...inquiryForm, visitDate: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-accent btn-full" style={{ marginTop: '16px' }}>
                                Send Inquiry
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default InquiryModal;
