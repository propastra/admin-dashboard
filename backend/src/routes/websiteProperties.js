const express = require('express');
const router = express.Router();
const { Property, Interaction, Visitor } = require('../models');
const { Op } = require('sequelize');

// @route   GET /api/website/properties
// @desc    Search/filter properties with pagination
// @access  Public
router.get('/', async (req, res) => {
    try {
        const {
            city,
            category,
            minPrice,
            maxPrice,
            search,
            status,
            page = 1,
            limit = 12,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
        } = req.query;

        const where = {};

        // Only show available properties by default
        where.status = status || 'Available';

        if (city) {
            where.location = { [Op.like]: `%${city}%` };
        }

        if (category) {
            where.category = category;
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
            if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
        }

        if (search) {
            where[Op.or] = [
                { propertyName: { [Op.like]: `%${search}%` } },
                { location: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
                { projectName: { [Op.like]: `%${search}%` } },
            ];
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Property.findAndCountAll({
            where,
            order: [[sortBy, sortOrder]],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            properties: rows,
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/website/properties/featured
// @desc    Get featured/newest properties for homepage
// @access  Public
router.get('/featured', async (req, res) => {
    try {
        const properties = await Property.findAll({
            where: { status: 'Available' },
            order: [['createdAt', 'DESC']],
            limit: 6,
        });
        res.json(properties);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/website/properties/cities
// @desc    Get distinct cities/locations
// @access  Public
router.get('/cities', async (req, res) => {
    try {
        const properties = await Property.findAll({
            attributes: ['location'],
            group: ['location'],
        });

        // Count properties per location
        const cities = await Promise.all(
            properties.map(async (p) => {
                const count = await Property.count({
                    where: { location: p.location, status: 'Available' },
                });
                return { name: p.location, propertyCount: count };
            })
        );

        res.json(cities);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/website/properties/:id
// @desc    Get single property detail with view tracking
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Track view interaction
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        const userAgent = req.headers['user-agent'] || '';

        let visitor = await Visitor.findOne({ where: { ipAddress } });
        if (!visitor) {
            visitor = await Visitor.create({ ipAddress, userAgent });
        }

        if (!visitor.isBlocked) {
            await Interaction.create({
                interactionType: 'View',
                propertyId: property.id,
                visitorId: visitor.id,
                metadata: { source: 'website' },
            });
        }

        res.json(property);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
