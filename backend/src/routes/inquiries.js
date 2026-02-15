const express = require('express');
const router = express.Router();
const { Inquiry, Property } = require('../models');
const auth = require('../middleware/auth');

// @route   POST api/inquiries
// @desc    Submit a new inquiry (Public)
// @access  Public
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message, propertyId } = req.body;

        const newInquiry = await Inquiry.create({
            name,
            email,
            phone,
            message,
            propertyId
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
        const inquiries = await Inquiry.findAll({
            include: [{
                model: Property,
                attributes: ['propertyName', 'location', 'price', 'priceUnit', 'category']
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
        const { status } = req.body;
        const inquiry = await Inquiry.findByPk(req.params.id);

        if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

        inquiry.status = status;
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
