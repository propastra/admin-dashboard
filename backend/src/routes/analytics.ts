const express = require('express');
const router = express.Router();
const { Interaction, Property, Visitor, WebsiteUser, sequelize } = require('../models');
const { Op } = require('sequelize');

// @route   POST api/analytics/track
// @desc    Track user interaction (View/Click/Search)
// @access  Public
router.post('/track', async (req, res) => {
    const { interactionType, propertyId, ipAddress: bodyIp, userAgent: bodyUserAgent, metadata, websiteUserId } = req.body;
    // Always resolve ip and userAgent: from body, request, or fallback (frontend often sends only interactionType + propertyId)
    const ipAddress = (bodyIp && String(bodyIp).trim()) || req.ip || (req.headers['x-forwarded-for'] && String(req.headers['x-forwarded-for']).split(',')[0].trim()) || 'anonymous';
    const userAgent = (bodyUserAgent && String(bodyUserAgent).trim()) || req.get('User-Agent') || 'unknown';

    try {
        // Find or Create Visitor
        let visitor = await Visitor.findOne({ where: { ipAddress } });
        if (!visitor) {
            visitor = await Visitor.create({ ipAddress, userAgent });
        } else {
            visitor.userAgent = userAgent;
            visitor.lastVisit = new Date();
            await visitor.save();
        }

        if (visitor.isBlocked) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Create Interaction (propertyId optional for e.g. Search/Click without property)
        const interactionPayload: any = {
            interactionType: interactionType || 'View',
            visitorId: visitor.id,
            metadata: metadata && typeof metadata === 'object' ? metadata : undefined
        };
        if (propertyId) interactionPayload.propertyId = propertyId;
        if (websiteUserId) interactionPayload.websiteUserId = websiteUserId;

        try {
            await Interaction.create(interactionPayload);
        } catch (createErr) {
            const msg = (createErr && createErr.message) || '';
            if ((propertyId || websiteUserId) && (msg.includes('propertyId') || msg.includes('websiteUserId') || msg.includes('SQLITE_ERROR') || msg.includes('column') || msg.includes('FOREIGN KEY') || msg.includes('SQLITE_CONSTRAINT'))) {
                delete interactionPayload.propertyId;
                delete interactionPayload.websiteUserId;
                await Interaction.create(interactionPayload);
            } else {
                throw createErr;
            }
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Analytics track error:', err.message);
        res.status(500).json({ message: 'Server error', error: process.env.NODE_ENV !== 'production' ? err.message : undefined });
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
                { model: Visitor, attributes: ['ipAddress'] },
                { model: WebsiteUser, attributes: ['name', 'email'] }
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
        const [totalProperties, totalVisitors, totalInteractions, topProperties] = await Promise.all([
            Property.count(),
            Visitor.count(),
            Interaction.count(),
            Interaction.findAll({
                attributes: [
                    'propertyId',
                    [sequelize.fn('COUNT', sequelize.col('Interaction.id')), 'count']
                ],
                where: { interactionType: 'View' },
                include: [{ model: Property, attributes: ['propertyName'] }],
                group: ['propertyId', 'Property.id'],
                order: [[sequelize.literal('count'), 'DESC']],
                limit: 5
            })
        ]);

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

// @route   GET api/analytics/user-interests
// @desc    Get aggregated user interests and lead scores
// @access  Private (Admin)
router.get('/user-interests', async (req, res) => {
    try {
        // Use SQL aggregation to compute lead scores and counts
        const users = await WebsiteUser.findAll({
            attributes: ['id', 'name', 'email', 'phone', 'city'],
            include: [{
                model: Interaction,
                required: true,
                attributes: ['id', 'interactionType', 'metadata', 'createdAt'],
                include: [{ model: Property, attributes: ['id', 'category', 'location', 'propertyName'] }]
            }],
            // Limit to users with recent activity (last 90 days) to reduce memory
            order: [['createdAt', 'DESC']]
        });

        const interestProfiles = users.map(user => {
            const interactions = user.Interactions || [];
            const categoryCounts: any = {};
            const locationCounts: any = {};
            let leadScore = 0;
            const comparisons: any[] = [];
            const seenPropertyIds = new Set();
            const recentProperties: any[] = [];

            for (const act of interactions) {
                // Scoring
                switch (act.interactionType) {
                    case 'View': leadScore += 1; break;
                    case 'Click': leadScore += 2; break;
                    case 'Search': leadScore += 3; break;
                    case 'Comparison':
                        leadScore += 10;
                        if (act.metadata && act.metadata.propertyNames) {
                            comparisons.push({
                                date: act.createdAt,
                                names: act.metadata.propertyNames
                            });
                        }
                        break;
                    case 'Inquiry': leadScore += 20; break;
                }

                // Interests aggregation
                if (act.Property) {
                    const cat = act.Property.category;
                    const loc = act.Property.location;
                    if (cat) categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                    if (loc) locationCounts[loc] = (locationCounts[loc] || 0) + 1;

                    if (recentProperties.length < 5 && !seenPropertyIds.has(act.Property.id)) {
                        seenPropertyIds.add(act.Property.id);
                        recentProperties.push({
                            id: act.Property.id,
                            name: act.Property.propertyName
                        });
                    }
                }
            }

            // Find top category and location
            const topCategory = Object.entries(categoryCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';
            const topLocation = Object.entries(locationCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';

            return {
                userId: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                city: user.city,
                leadScore,
                engagementLevel: leadScore > 50 ? 'High' : leadScore > 15 ? 'Medium' : 'Low',
                topCategory,
                topLocation,
                comparisonCount: comparisons.length,
                recentComparisons: comparisons.slice(0, 3),
                recentProperties,
                interactionCount: interactions.length
            };
        });

        // Sort by lead score descending
        interestProfiles.sort((a, b) => b.leadScore - a.leadScore);

        res.json(interestProfiles);
    } catch (err) {
        console.error('User interests error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
