const express = require('express');
const router = express.Router();
const { Visitor } = require('../models');
const auth = require('../middleware/auth');

// @route   GET api/visitors
// @desc    Get all visitors
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const visitors = await Visitor.findAll({ order: [['lastVisit', 'DESC']] });
        res.json(visitors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/visitors/block/:id
// @desc    Block/Unblock visitor
// @access  Private
router.put('/block/:id', auth, async (req, res) => {
    try {
        const visitor = await Visitor.findByPk(req.params.id);
        if (!visitor) return res.status(404).json({ message: 'Visitor not found' });

        visitor.isBlocked = !visitor.isBlocked;
        await visitor.save();

        res.json(visitor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/visitors/:id/history
// @desc    Get detailed history for a visitor
// @access  Private (Admin)
router.get('/:id/history', async (req, res) => {
    try {
        const interactions = await Interaction.findAll({
            where: { visitorId: req.params.id },
            include: [{ model: Property, attributes: ['propertyName'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(interactions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
