const express = require('express');
const router = express.Router();
const { Inquiry, Property, User, WebsiteUser } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

// @route   POST api/inquiries
// @desc    Submit a new inquiry (Public)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message, propertyId, visitDate } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ message: 'Name and phone are required' });
        }

        // --- Auto Registration / User Linking Logic ---
        let websiteUserId = null;
        let autoLoggedUser = null;
        let authToken = null;

        if (email || phone) {
            try {
                // Find existing user by phone (primary) or email
                const searchCriteria: any[] = [
                    { phone: String(phone).trim() }
                ];
                if (email) searchCriteria.push({ email: String(email).trim() });

                let user = await WebsiteUser.findOne({
                    where: {
                        [Op.or]: searchCriteria
                    }
                });

                if (!user) {
                    // Create new user if not exists
                    const tempPassword = `welcome_${Math.random().toString(36).slice(-8)}`;
                    const userEmail = email ? String(email).trim() : `${phone}@mobile.propastra.com`;
                    
                    user = await WebsiteUser.create({
                        name: String(name).trim(),
                        email: userEmail,
                        phone: String(phone).trim(),
                        password: tempPassword
                    });
                    console.log(`[Inquiry] Created new WebsiteUser: ${user.id} (${userEmail})`);
                } else {
                    console.log(`[Inquiry] Found existing WebsiteUser: ${user.id}`);
                    // Optionally update name if it was generic before
                    if (name && (user.name.startsWith('User ') || user.name !== String(name).trim())) {
                        await user.update({ name: String(name).trim() });
                    }
                }

                websiteUserId = user.id;

                const payload = { websiteUser: { id: user.id } };
                authToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
                autoLoggedUser = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    city: user.city
                };
            } catch (err) {
                console.error('[Inquiry] Auto-registration error:', err);
                // We'll still proceed to create the inquiry even if user creation fails
            }
        }

        // Auto assign to available agent
        let assignedTo = null;
        try {
            const agent = await User.findOne({ where: { role: 'Agent' } });
            if (agent) {
                assignedTo = agent.id;
            }
        } catch (e) { console.error("Agent assignment failed", e); }

        const payload: any = {
            name: String(name).trim(),
            email: email ? String(email).trim() : null,
            phone: String(phone).trim(),
            message: message ? String(message).trim() : null,
            visitDate: visitDate || null,
            assignedTo,
            websiteUserId,
            propertyId: propertyId || null
        };

        let newInquiry;
        try {
            newInquiry = await Inquiry.create(payload);
        } catch (createErr) {
            const msg = createErr.message || '';
            if (payload.propertyId && (msg.includes('propertyId') || msg.includes('SQLITE_ERROR') || msg.includes('column') || msg.includes('FOREIGN KEY') || msg.includes('SQLITE_CONSTRAINT'))) {
                delete payload.propertyId;
                newInquiry = await Inquiry.create(payload);
            } else {
                throw createErr;
            }
        }

        res.status(201).json({
            inquiry: newInquiry,
            token: authToken,
            user: autoLoggedUser
        });
    } catch (err) {
        console.error('Inquiry create error:', err.message);
        res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV !== 'production' ? err.message : undefined });
    }
});

// @route   GET api/inquiries
// @desc    Get all inquiries with property details
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        // Ensure User is attached to token in auth middleware. Fallback query if needed:
        const user: any = await User.findByPk((req as any).user.id);

        let where: any = {};
        if (user && user.role === 'Agent') {
            where.assignedTo = user.id;
        }

        const inquiries = await Inquiry.findAll({
            where,
            include: [{
                model: Property,
                attributes: ['propertyName', 'location', 'price', 'priceUnit', 'category']
            }, {
                model: User,
                attributes: ['username', 'id']
            }],
            order: [['createdAt', 'DESC']]
        });
        res.json(inquiries);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/inquiries/:id
// @desc    Update inquiry status
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { status, visitDate, followUpDate, assignedTo } = req.body;
        const inquiry = await Inquiry.findByPk(req.params.id);

        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        if (status) inquiry.status = status;
        if (visitDate) inquiry.visitDate = visitDate;
        if (followUpDate) inquiry.followUpDate = followUpDate;
        if (assignedTo !== undefined) inquiry.assignedTo = assignedTo;
        await inquiry.save();

        res.json(inquiry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/inquiries/:id
// @desc    Delete inquiry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const inquiry = await Inquiry.findByPk(req.params.id);
        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        await inquiry.destroy();
        res.json({ message: 'Inquiry removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/inquiries/dashboard/stats
// @desc    Get agent performance dashboard stats
// @access  Private (Agent)
router.get('/dashboard/stats', auth, async (req, res) => {
    try {
        const userId = (req as any).user.id;
        const totalLeads = await Inquiry.count({ where: { assignedTo: userId } });
        const newLeads = await Inquiry.count({ where: { assignedTo: userId, status: 'New' } });
        const contactedLeads = await Inquiry.count({ where: { assignedTo: userId, status: 'Contacted' } });
        const visitScheduled = await Inquiry.count({ where: { assignedTo: userId, status: 'Visit Scheduled' } });
        const closedDeals = await Inquiry.count({ where: { assignedTo: userId, status: 'Closed' } });

        res.json({
            totalLeads,
            newLeads,
            contactedLeads,
            visitScheduled,
            closedDeals
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
