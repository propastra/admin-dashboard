const express = require('express');
const router = express.Router();
const { Favorite, Property } = require('../models');
const websiteUserAuth = require('../middleware/websiteUserAuth');
const { Op } = require('sequelize');

const enrichPropertiesWithCoverPhoto = async (properties: any[]) => {
    if (!properties || properties.length === 0) return properties;

    const propsWithCovers = await Property.findAll({
        attributes: ['propertyName', 'projectName', 'coverPhoto'],
        where: {
            coverPhoto: { [Op.not]: null, [Op.ne]: '' }
        }
    });

    const getProjectName = (p: any) => {
        if (p.projectName && p.projectName.trim()) return p.projectName.trim().toLowerCase();
        if (p.propertyName) {
            const beforeHyphen = p.propertyName.split('-')[0].trim();
            if (beforeHyphen) return beforeHyphen.toLowerCase();
            return p.propertyName.split(' ').slice(0, 2).join(' ').trim().toLowerCase();
        }
        return '';
    };

    const projectCovers = new Map();
    for (const p of propsWithCovers) {
        const pName = getProjectName(p);
        if (pName && !projectCovers.has(pName)) {
            projectCovers.set(pName, p.coverPhoto);
        }
    }

    return properties.map((p: any) => {
        const pData = p.toJSON ? p.toJSON() : JSON.parse(JSON.stringify(p));
        if (pData.Property && !pData.Property.coverPhoto) {
            const pName = getProjectName(pData.Property);
            if (pName && projectCovers.has(pName)) {
                pData.Property.coverPhoto = projectCovers.get(pName);
            }
        }
        return pData;
    });
};

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
        const enrichedFavorites = await enrichPropertiesWithCoverPhoto(favorites);
        res.json(enrichedFavorites);
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
