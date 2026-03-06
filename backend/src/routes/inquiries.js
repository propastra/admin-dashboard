const express = require('express');
const router = express.Router();
const { Inquiry, Property, User } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// @route   POST api/inquiries
// @desc    Submit a new inquiry (Public)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message, propertyId, visitDate } = req.body;

        // Auto assign to available agent (simple round robin or random could be used, just picking first for now)
        let assignedTo = null;
        try {
            const agent = await User.findOne({ where: { role: 'Agent' } });
            if (agent) {
                assignedTo = agent.id;
            }
        } catch (e) { console.error("Agent assignment failed", e); }

        const newInquiry = await Inquiry.create({
            name,
            email,
            phone,
            message,
            propertyId,
            visitDate,
            assignedTo
        });

        res.json(newInquiry);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/inquiries
// @desc    Get all inquiries with property details
// @access  Private (Admin only)
router.get('/', auth, async (req, res) => {
    try {
        // Ensure User is attached to token in auth middleware. Fallback query if needed:
        const user = await User.findByPk(req.user.id);

        let where = {};
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

module.exports = router;

// @route   GET api/inquiries/dashboard/stats
// @desc    Get agent performance dashboard stats
// @access  Private (Agent)
router.get('/dashboard/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;
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
