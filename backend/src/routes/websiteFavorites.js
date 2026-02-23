const express = require('express');
const router = express.Router();
const { Favorite, Property } = require('../models');
const websiteUserAuth = require('../middleware/websiteUserAuth');

// @route   GET /api/website/favorites
// @desc    Get user's favorite properties
// @access  Private (Website User)
router.get('/', websiteUserAuth, async (req, res) => {
    try {
        const favorites = await Favorite.findAll({
            where: { websiteUserId: req.websiteUser.id },
            include: [{ model: Property }],
            order: [['createdAt', 'DESC']],
        });
        res.json(favorites);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST /api/website/favorites
// @desc    Add property to favorites
// @access  Private (Website User)
router.post('/', websiteUserAuth, async (req, res) => {
    try {
        const { propertyId } = req.body;

        // Check if already favorited
        const existing = await Favorite.findOne({
            where: {
                websiteUserId: req.websiteUser.id,
                propertyId,
            },
        });

        if (existing) {
            return res.status(400).json({ message: 'Already in favorites' });
        }

        const favorite = await Favorite.create({
            websiteUserId: req.websiteUser.id,
            propertyId,
        });

        res.json(favorite);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/website/favorites/:propertyId
// @desc    Remove property from favorites
// @access  Private (Website User)
router.delete('/:propertyId', websiteUserAuth, async (req, res) => {
    try {
        const favorite = await Favorite.findOne({
            where: {
                websiteUserId: req.websiteUser.id,
                propertyId: req.params.propertyId,
            },
        });

        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        await favorite.destroy();
        res.json({ message: 'Removed from favorites' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
