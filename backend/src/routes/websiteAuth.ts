const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { WebsiteUser, LoginLead } = require('../models');
const websiteUserAuth = require('../middleware/websiteUserAuth');

// @route   POST /api/website/auth/register
// @desc    Register a new website user
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        let user = await WebsiteUser.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        user = await WebsiteUser.create({ name, email, phone, password });

        const lead = await LoginLead.create({
            websiteUserId: user.id,
            loginMethod: 'Email',
            ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        if ((req as any).io) {
            (req as any).io.emit('new_lead', {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                method: 'Email Register',
                timestamp: lead.createdAt
            });
        }

        const payload = {
            websiteUser: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        city: user.city,
                    },
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/website/auth/login
// @desc    Authenticate website user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await WebsiteUser.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await user.validPassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const lead = await LoginLead.create({
            websiteUserId: user.id,
            loginMethod: 'Email',
            ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        if ((req as any).io) {
            (req as any).io.emit('new_lead', {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                method: 'Email Login',
                timestamp: lead.createdAt
            });
        }

        const payload = {
            websiteUser: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        city: user.city,
                    },
                });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/website/auth/me
// @desc    Get current website user profile
// @access  Private (Website User)
router.get('/me', websiteUserAuth, async (req, res) => {
    try {
        const user = await WebsiteUser.findByPk(req.websiteUser.id, {
            attributes: { exclude: ['password'] },
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/website/auth/profile
// @desc    Update website user profile
// @access  Private (Website User)
router.put('/profile', websiteUserAuth, async (req, res) => {
    try {
        const user = await WebsiteUser.findByPk(req.websiteUser.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, phone, city } = req.body;
        await user.update({ name, phone, city });

        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            city: user.city,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// ======= MOBILE OTP LOGIN (MSG91 INTEGRATION) =======
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '498901AxauERK9gQ69ad9102P1';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '6ac64f0f94b4d9a4e70b1c82';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'PAVRLL';

// In-memory fallback store for test numbers or local dev
const otpStore = new Map();

// @route   POST /api/website/auth/send-otp
// @desc    Send OTP to mobile number via MSG91
// @access  Public
router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Please provide a mobile number' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
        return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
    }

    try {
        // Dedicated test number bypass (for testing without consuming SMS credits)
        if (cleanPhone === '9999999999' || cleanPhone === '9000000000') {
            otpStore.set(cleanPhone, {
                otp: '9999',
                expiresAt: Date.now() + 5 * 60 * 1000,
            });
            console.log(`\n📱 [TEST BYPASS] OTP for +91 ${cleanPhone}: 9999\n`);
            return res.json({ message: 'OTP sent successfully (Test Mode)', phone: cleanPhone });
        }

        if (!MSG91_AUTH_KEY) {
            // Development fallback when no auth key is configured
            const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
            otpStore.set(cleanPhone, {
                otp: generatedOtp,
                expiresAt: Date.now() + 5 * 60 * 1000,
            });
            console.log(`\n📱 SIMULATED OTP FOR +91 ${cleanPhone}: >>> ${generatedOtp} <<<\n`);
            return res.json({ message: 'OTP generated (Simulated)', phone: cleanPhone });
        }

        // Generate 4-digit OTP and store locally in memory for verification
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        otpStore.set(cleanPhone, {
            otp: generatedOtp,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });

        console.log(`\n==========================================`);
        console.log(`📱 Sending OTP [${generatedOtp}] to +91 ${cleanPhone}`);
        console.log(`==========================================\n`);

        let sentSuccess = false;

        // 1. Dispatch via MSG91 Flow API (designed for SMS templates with ##OTP## variables)
        try {
            const flowPayload = {
                template_id: MSG91_TEMPLATE_ID,
                sender: MSG91_SENDER_ID,
                mobiles: `91${cleanPhone}`,
                OTP: generatedOtp,
            };
            const flowRes = await axios.post('https://control.msg91.com/api/v5/flow/', flowPayload, {
                headers: {
                    authkey: MSG91_AUTH_KEY,
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
            });
            console.log(`📱 MSG91 Flow API Response:`, flowRes.data);
            if (flowRes.data && flowRes.data.type === 'success') {
                sentSuccess = true;
            }
        } catch (flowErr: any) {
            console.error('MSG91 Flow API Error:', flowErr.response?.data || flowErr.message);
        }

        // 2. Also trigger MSG91 SendOTP API endpoint with OTP parameter
        try {
            const otpUrl = `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=91${cleanPhone}&authkey=${MSG91_AUTH_KEY}&sender=${MSG91_SENDER_ID}&otp=${generatedOtp}`;
            const otpRes = await axios.post(
                otpUrl,
                { OTP: generatedOtp },
                {
                    headers: {
                        authkey: MSG91_AUTH_KEY,
                        'Content-Type': 'application/json',
                    },
                }
            );
            console.log(`📱 MSG91 SendOTP API Response:`, otpRes.data);
            if (otpRes.data && otpRes.data.type === 'success') {
                sentSuccess = true;
            }
        } catch (otpErr: any) {
            console.error('MSG91 SendOTP Error:', otpErr.response?.data || otpErr.message);
        }

        return res.json({
            message: 'OTP sent successfully to your mobile number via SMS',
            phone: cleanPhone,
        });
    } catch (err: any) {
        console.error('Send OTP Error:', err.response?.data || err.message);
        res.status(500).json({
            message: err.response?.data?.message || 'Failed to send OTP via SMS. Please try again.',
        });
    }
});

// @route   POST /api/website/auth/resend-otp
// @desc    Resend OTP to mobile number via MSG91
// @access  Public
router.post('/resend-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Please provide a mobile number' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
        return res.status(400).json({ message: 'Please provide a valid 10-digit mobile number' });
    }

    if (cleanPhone === '9999999999' || cleanPhone === '9000000000') {
        otpStore.set(cleanPhone, {
            otp: '9999',
            expiresAt: Date.now() + 5 * 60 * 1000,
        });
        console.log(`\n📱 [TEST BYPASS] Resent OTP for +91 ${cleanPhone}: 9999\n`);
        return res.json({ message: 'OTP resent successfully (Test Mode)', phone: cleanPhone });
    }

    try {
        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
        otpStore.set(cleanPhone, {
            otp: generatedOtp,
            expiresAt: Date.now() + 10 * 60 * 1000,
        });

        console.log(`\n📱 Resending OTP [${generatedOtp}] to +91 ${cleanPhone}\n`);

        if (MSG91_AUTH_KEY) {
            // 1. Dispatch via Flow API
            const flowPayload = {
                template_id: MSG91_TEMPLATE_ID,
                sender: MSG91_SENDER_ID,
                mobiles: `91${cleanPhone}`,
                OTP: generatedOtp,
            };
            await axios.post('https://control.msg91.com/api/v5/flow/', flowPayload, {
                headers: {
                    authkey: MSG91_AUTH_KEY,
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                },
            }).catch(() => null);

            // 2. Also trigger SendOTP as backup
            const sendUrl = `https://control.msg91.com/api/v5/otp?template_id=${MSG91_TEMPLATE_ID}&mobile=91${cleanPhone}&authkey=${MSG91_AUTH_KEY}&sender=${MSG91_SENDER_ID}&otp=${generatedOtp}`;
            await axios.post(sendUrl, { OTP: generatedOtp }, {
                headers: {
                    authkey: MSG91_AUTH_KEY,
                    'Content-Type': 'application/json',
                },
            }).catch(() => null);
        }

        return res.json({ message: 'OTP resent successfully via SMS', phone: cleanPhone });
    } catch (err: any) {
        console.error('Resend OTP Error:', err.response?.data || err.message);
        res.status(500).json({ message: err.response?.data?.message || 'Failed to resend OTP' });
    }
});

// @route   POST /api/website/auth/verify-otp
// @desc    Verify OTP and login/register user
// @access  Public
router.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ message: 'Phone and OTP are required' });
    }

    const cleanPhone = phone.toString().replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.toString().trim();

    try {
        let isVerified = false;

        // Check test bypass number
        if ((cleanPhone === '9999999999' || cleanPhone === '9000000000') && cleanOtp === '9999') {
            isVerified = true;
        } else if (otpStore.has(cleanPhone)) {
            // Check fallback memory store
            const stored = otpStore.get(cleanPhone);
            if (stored && Date.now() <= stored.expiresAt && stored.otp === cleanOtp) {
                isVerified = true;
                otpStore.delete(cleanPhone);
            }
        }

        // Verify with MSG91
        if (!isVerified && MSG91_AUTH_KEY) {
            try {
                const verifyUrl = `https://control.msg91.com/api/v5/otp/verify?otp=${cleanOtp}&mobile=91${cleanPhone}&authkey=${MSG91_AUTH_KEY}`;
                const response = await axios.get(verifyUrl, {
                    headers: { authkey: MSG91_AUTH_KEY }
                });

                if (response.data && response.data.type === 'success') {
                    isVerified = true;
                } else {
                    return res.status(400).json({
                        message: response.data?.message || 'Invalid or expired OTP. Please try again.',
                    });
                }
            } catch (msg91Err: any) {
                console.error('MSG91 Verify Error:', msg91Err.response?.data || msg91Err.message);
                return res.status(400).json({
                    message: msg91Err.response?.data?.message || 'Invalid or expired OTP. Please check and try again.',
                });
            }
        }

        if (!isVerified) {
            return res.status(400).json({ message: 'Invalid OTP. Please check the code and try again.' });
        }

        // Find or create user by phone
        let user = await WebsiteUser.findOne({ where: { phone: cleanPhone } });
        if (!user) {
            user = await WebsiteUser.create({
                name: `User ${cleanPhone.slice(-4)}`,
                phone: cleanPhone,
                email: `${cleanPhone}@mobile.propastra.com`,
                password: `otp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            });
        }

        const lead = await LoginLead.create({
            websiteUserId: user.id,
            loginMethod: 'OTP',
            ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
            userAgent: req.headers['user-agent'] || 'unknown',
        });

        if ((req as any).io) {
            (req as any).io.emit('new_lead', {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                method: 'OTP Login',
                timestamp: lead.createdAt
            });
        }

        const payload = {
            websiteUser: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' },
            (err: any, token: string) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                        city: user.city,
                    },
                });
            }
        );
    } catch (err: any) {
        console.error('Verify OTP Error:', err.response?.data || err.message);
        res.status(500).json({ message: err.response?.data?.message || 'Server error during verification' });
    }
});

module.exports = router;
