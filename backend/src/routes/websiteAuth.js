const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { WebsiteUser } = require('../models');
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

// ======= MOBILE OTP LOGIN =======
// In-memory OTP store (production: use Redis + SMS API like Twilio)
const otpStore = new Map();

// @route   POST /api/website/auth/send-otp
// @desc    Send OTP to mobile number (simulated – logs to console)
// @access  Public
router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone || phone.length < 10) {
        return res.status(400).json({ message: 'Please provide a valid mobile number' });
    }

    try {
        // Hardcoded OTP for dev/staging – use random OTP + SMS in production
        const otp = '9999';

        // Store OTP with 5-minute expiry
        otpStore.set(phone, {
            otp,
            expiresAt: Date.now() + 5 * 60 * 1000,
        });

        // In production, send SMS via Twilio / MSG91 etc.
        // For now, log to console
        console.log(`\n📱 OTP for +91 ${phone}: ${otp}\n`);

        res.json({ message: 'OTP sent successfully', phone });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
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

    try {
        // Check OTP
        const stored = otpStore.get(phone);
        if (!stored) {
            return res.status(400).json({ message: 'OTP expired or not sent. Please request a new one.' });
        }

        if (Date.now() > stored.expiresAt) {
            otpStore.delete(phone);
            return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
        }

        if (stored.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
        }

        // OTP valid – clean up
        otpStore.delete(phone);

        // Find or create user by phone
        let user = await WebsiteUser.findOne({ where: { phone } });
        if (!user) {
            user = await WebsiteUser.create({
                name: `User ${phone.slice(-4)}`,
                phone,
                email: `${phone}@mobile.propastra.com`,
                password: `otp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
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

module.exports = router;
