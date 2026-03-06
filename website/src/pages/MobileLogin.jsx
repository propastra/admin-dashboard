import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, ShieldCheck } from 'lucide-react';
import { sendOtp, verifyOtp } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './MobileLogin.css';

const MobileLogin = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    const startResendTimer = () => {
        setResendTimer(30);
        const interval = setInterval(() => {
            setResendTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError('');

        if (phone.length < 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        try {
            await sendOtp({ phone });
            setOtpSent(true);
            startResendTimer();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');

        if (otp.length < 4) {
            setError('Please enter the complete OTP');
            return;
        }

        setLoading(true);
        try {
            const res = await verifyOtp({ phone, otp });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setError('');
        setLoading(true);
        try {
            await sendOtp({ phone });
            startResendTimer();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="auth-card">
                <img src="/images/IMG_8664.png" alt="Propastra" className="auth-logo" />

                {!otpSent ? (
                    <>
                        <h1 className="login-title">Mobile Login</h1>
                        <p className="login-subtitle">Enter your mobile number to receive OTP</p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSendOtp} className="login-form">
                            <div className="input-group">
                                <label>Mobile Number</label>
                                <div className="input-field">
                                    <Phone size={18} className="icon" />
                                    <input
                                        type="tel"
                                        placeholder="Enter your mobile number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-accent btn-full login-btn"
                                disabled={loading || phone.length < 10}
                            >
                                {loading ? 'Sending...' : 'Send OTP'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="otp-icon-wrap">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="login-title">Verify OTP</h1>
                        <p className="login-subtitle">
                            We've sent a code to <strong>+91 {phone}</strong>
                        </p>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleVerifyOtp} className="login-form">
                            <div className="input-group">
                                <label>Enter OTP</label>
                                <div className="otp-inputs">
                                    {[0, 1, 2, 3].map((i) => (
                                        <input
                                            key={i}
                                            type="text"
                                            maxLength={1}
                                            className="otp-box"
                                            value={otp[i] || ''}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                const newOtp = otp.split('');
                                                newOtp[i] = val;
                                                setOtp(newOtp.join(''));
                                                // Auto-focus next
                                                if (val && e.target.nextElementSibling) {
                                                    e.target.nextElementSibling.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !otp[i] && e.target.previousElementSibling) {
                                                    e.target.previousElementSibling.focus();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-accent btn-full login-btn"
                                disabled={loading || otp.length < 4}
                            >
                                {loading ? 'Verifying...' : 'Verify & Login'}
                            </button>
                        </form>

                        <div className="resend-row">
                            <span>Didn't receive OTP? </span>
                            {resendTimer > 0 ? (
                                <span className="resend-timer">Resend in {resendTimer}s</span>
                            ) : (
                                <button className="resend-btn" onClick={handleResendOtp}>
                                    Resend OTP
                                </button>
                            )}
                        </div>

                        <button className="change-number-btn" onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}>
                            Change number
                        </button>
                    </>
                )}

                <button className="back-btn" onClick={() => navigate('/auth')}>
                    <ArrowLeft size={16} /> Back
                </button>
            </div>
        </div>
    );
};

export default MobileLogin;
