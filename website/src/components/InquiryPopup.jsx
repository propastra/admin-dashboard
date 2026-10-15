import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck } from 'lucide-react';
import { submitInquiry, sendOtp, verifyOtp, resendOtp } from '../services/api';
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

    // OTP verification states
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [resendTimer, setResendTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => (prev <= 1 ? 0 : prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handlePhoneChange = (val) => {
        const cleanVal = val.replace(/\D/g, '').slice(0, 10);
        setForm((prev) => ({ ...prev, phone: cleanVal }));
        if (phoneVerified) {
            setPhoneVerified(false);
            setOtpSent(false);
            setOtp('');
        }
    };

    const handleSendOtp = async () => {
        const cleanPhone = form.phone.trim();
        if (cleanPhone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number before verifying.');
            return;
        }

        setError('');
        setOtpError('');
        setOtpLoading(true);

        try {
            await sendOtp({ phone: cleanPhone });
            setOtpSent(true);
            setResendTimer(30);
        } catch (err) {
            console.error('Send OTP error:', err);
            setOtpError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setOtpError('');
        setOtpLoading(true);
        try {
            await resendOtp({ phone: form.phone.trim() });
            setResendTimer(30);
        } catch (err) {
            console.error('Resend OTP error:', err);
            setOtpError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim() || otp.trim().length < 4) {
            setOtpError('Please enter the valid OTP.');
            return;
        }

        setOtpError('');
        setOtpLoading(true);

        try {
            const res = await verifyOtp({
                phone: form.phone.trim(),
                otp: otp.trim(),
            });

            // Log user in with issued token
            if (res.data && res.data.token && res.data.user) {
                login(res.data.token, res.data.user);
            }

            setPhoneVerified(true);
            setOtpSent(false);
            setOtp('');
        } catch (err) {
            console.error('Verify OTP error:', err);
            setOtpError(err.response?.data?.message || 'Invalid OTP. Please check and try again.');
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (!form.name.trim() || form.name.trim().length < 2 || !nameRegex.test(form.name.trim())) {
            setError('Please enter a valid name (alphabets only).');
            return;
        }
        
        const cleanPhone = form.phone.replace(/[\s-]/g, '');
        if (!cleanPhone || cleanPhone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }

        // If phone is not verified yet, send OTP and prompt user
        if (!phoneVerified) {
            if (!otpSent) {
                await handleSendOtp();
            }
            setError('Please verify your mobile number with the OTP sent to your phone.');
            return;
        }

        if (form.email && form.email.trim()) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(form.email.trim())) {
                setError('Please enter a valid email address.');
                return;
            }
        }
        
        setError('');
        setSending(true);
        try {
            const res = await submitInquiry({
                name: form.name.trim(),
                phone: cleanPhone,
                email: form.email.trim() || undefined,
                message: form.message.trim() || undefined,
                propertyId: propertyId || undefined,
            });
            
            // Auto login if token returned
            if (res.data && res.data.token && res.data.user) {
                login(res.data.token, res.data.user);
            }
            // Mark first visit done permanently so popup never shows again
            localStorage.setItem('inquiry_first_visit_shown', '1');

            setSent(true);
            setTimeout(() => {
                setSent(false);
                setForm({ name: '', phone: '', email: '', message: '' });
                setPhoneVerified(false);
                setOtpSent(false);
                setOtp('');
                runPendingAndClose();
            }, 1200);
        } catch (err) {
            console.error('Inquiry submission error:', err);
            setError(err.response?.data?.message || 'Failed to submit. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        setError('');
        setOtpError('');
        setForm({ name: '', phone: '', email: '', message: '' });
        setPhoneVerified(false);
        setOtpSent(false);
        setOtp('');
        setSent(false);
        closePopup();
    };

    if (!showPopup) return null;

    return (
        <div className="inquiry-popup-overlay">
            <div className="inquiry-popup-modal" onClick={(e) => e.stopPropagation()}>
                <button type="button" className="inquiry-popup-close" onClick={handleClose} aria-label="Close">
                    <X size={22} />
                </button>

                {sent ? (
                    <div className="inquiry-popup-success">
                        <Check size={48} color="var(--accent)" />
                        <h3>Verified & Submitted!</h3>
                        <p>Welcome to PropAstra. Opening website...</p>
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
                                <div className="inquiry-label-row">
                                    <label>Mobile number <span className="required">*</span></label>
                                    {phoneVerified && (
                                        <span className="inquiry-verified-badge">
                                            <Check size={14} /> Verified
                                        </span>
                                    )}
                                </div>
                                <div className="inquiry-phone-input-row">
                                    <input
                                        type="tel"
                                        placeholder="Your 10-digit mobile number"
                                        value={form.phone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        maxLength={10}
                                        required
                                        disabled={phoneVerified}
                                    />
                                    {!phoneVerified && (
                                        <button
                                            type="button"
                                            className="inquiry-verify-btn"
                                            onClick={handleSendOtp}
                                            disabled={otpLoading || form.phone.length !== 10}
                                        >
                                            {otpLoading && !otpSent ? 'Sending...' : (otpSent ? 'Resend' : 'Verify')}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* OTP Box appears when OTP is sent and not yet verified */}
                            {otpSent && !phoneVerified && (
                                <div className="inquiry-otp-box">
                                    <div className="inquiry-otp-header">
                                        <ShieldCheck size={16} />
                                        <span>Enter OTP sent to +91 {form.phone}</span>
                                    </div>
                                    <div className="inquiry-otp-input-row">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            placeholder="Enter OTP"
                                            maxLength={6}
                                            className="inquiry-otp-field"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        />
                                        <button
                                            type="button"
                                            className="inquiry-otp-confirm-btn"
                                            onClick={handleVerifyOtp}
                                            disabled={otpLoading || otp.length < 4}
                                        >
                                            {otpLoading ? 'Verifying...' : 'Confirm OTP'}
                                        </button>
                                    </div>
                                    {otpError && <p className="inquiry-popup-error">{otpError}</p>}
                                    <div className="inquiry-otp-resend-row">
                                        {resendTimer > 0 ? (
                                            <span>Resend in {resendTimer}s</span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="inquiry-resend-link"
                                                onClick={handleResendOtp}
                                                disabled={otpLoading}
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

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

                            <button
                                type="submit"
                                className="inquiry-popup-submit"
                                disabled={sending || (!phoneVerified && form.phone.length < 10)}
                            >
                                {sending ? 'Submitting...' : (phoneVerified ? 'Submit & Explore' : 'Verify Mobile to Continue')}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default React.memo(InquiryPopup);
