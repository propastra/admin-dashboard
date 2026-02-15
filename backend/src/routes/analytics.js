const express = require('express');
const router = express.Router();
const { Interaction, Property, Visitor, sequelize } = require('../models');
const { Op } = require('sequelize');

// @route   POST api/analytics/track
// @desc    Track user interaction (View/Click/Search)
// @access  Public
router.post('/track', async (req, res) => {
    const { interactionType, propertyId, ipAddress, userAgent, metadata } = req.body;

    try {
        // Find or Create Visitor
        let visitor = await Visitor.findOne({ where: { ipAddress } });
        if (!visitor) {
            visitor = await Visitor.create({ ipAddress, userAgent });
        } else {
            // Update last visit
            visitor.changed('lastVisit', true);
            await visitor.save();
        }

        if (visitor.isBlocked) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Create Interaction
        await Interaction.create({
            interactionType,
            propertyId,
            visitorId: visitor.id,
            metadata
        });

        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/analytics/heartbeat
// @desc    Update visitor duration and last active time
// @access  Public
router.post('/heartbeat', async (req, res) => {
    const { ipAddress, durationIncrement } = req.body; // durationIncrement in seconds (e.g., 10s)

    try {
        const visitor = await Visitor.findOne({ where: { ipAddress } });
        if (visitor) {
            visitor.totalDuration = (visitor.totalDuration || 0) + (durationIncrement || 0);
            visitor.lastActive = new Date();
            await visitor.save();
            res.json({ success: true });
        } else {
            res.status(404).json({ message: 'Visitor not found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/analytics/activity
// @desc    Get detailed activity log
// @access  Private (Admin)
router.get('/activity', async (req, res) => {
    try {
        const activity = await Interaction.findAll({
            include: [
                { model: Property, attributes: ['propertyName'] },
                { model: Visitor, attributes: ['ipAddress'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 50 // Latest 50 actions
        });
        res.json(activity);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/analytics/chart-data
// @desc    Get aggregation for charts (Views per day)
// @access  Private (Admin)
router.get('/chart-data', async (req, res) => {
    try {
        // SQLite specific date format
        const data = await Interaction.findAll({
            attributes: [
                [sequelize.fn('date', sequelize.col('createdAt')), 'date'],
                [sequelize.fn('count', sequelize.col('id')), 'count']
            ],
            where: { interactionType: 'View' },
            group: [sequelize.fn('date', sequelize.col('createdAt'))],
            order: [[sequelize.col('date'), 'ASC']],
            limit: 30 // Last 30 days
        });
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/analytics/dashboard
// @desc    Get dashboard stats
// @access  Private (Admin)
router.get('/dashboard', async (req, res) => {
    try {
        const totalProperties = await Property.count();
        const totalVisitors = await Visitor.count();
        const totalInteractions = await Interaction.count();

        // Top 5 Properties by views
        const topProperties = await Interaction.findAll({
            attributes: [
                'propertyId',
                [sequelize.fn('COUNT', sequelize.col('Interaction.id')), 'count']
            ],
            where: { interactionType: 'View' },
            include: [{ model: Property, attributes: ['propertyName'] }],
            group: ['propertyId', 'Property.id'],
            order: [[sequelize.literal('count'), 'DESC']],
            limit: 5
        });

        res.json({
            totalProperties,
            totalVisitors,
            totalInteractions,
            topProperties
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
