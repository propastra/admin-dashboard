const express = require('express');
const router = express.Router();
const { Property, Interaction, Inquiry } = require('../models');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// @route   GET api/properties
// @desc    Get all properties
// @access  Public
router.get('/', async (req, res) => {
    try {
        const properties = await Property.findAll({ order: [['createdAt', 'DESC']] });
        res.json(properties);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Record View Interaction (Simple implementation, can be enhanced with Visitor ID)
        await Interaction.create({
            interactionType: 'View',
            propertyId: property.id,
            metadata: { source: 'api_request' }
        });

        res.json(property);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/properties
// @desc    Add new property
// @access  Private
router.post('/', [auth, upload.array('photos', 10)], async (req, res) => {
    try {
        const { propertyName, description, category, location, price, priceUnit, dimensions, configuration, projectName, amenities, status } = req.body;

        const photos = req.files.map(file => `/uploads/${file.filename}`);
        const parsedAmenities = amenities ? JSON.parse(amenities) : []; // Expecting JSON string from frontend

        const newProperty = await Property.create({
            propertyName,
            description,
            category,
            location,
            price,
            priceUnit,
            dimensions,
            configuration,
            photos,
            projectName,
            amenities: parsedAmenities,
            status
        });

        res.json(newProperty);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/properties/:id
// @desc    Update property
// @access  Private
router.put('/:id', [auth, upload.array('photos', 10)], async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        const { propertyName, description, category, location, price, priceUnit, dimensions, configuration, projectName, amenities, status, existingPhotos } = req.body;

        let photos = property.photos;

        // Handle new photos
        if (req.files && req.files.length > 0) {
            const newPhotos = req.files.map(file => `/uploads/${file.filename}`);
            photos = [...photos, ...newPhotos];
        }

        // Handle removed photos (if logic exists on frontend to pass remaining photos)
        // For now, simple append or replace logic could be used. 
        // If 'existingPhotos' is passed, filter current photos to match.
        if (existingPhotos) {
            const keptPhotos = Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos];
            photos = photos.filter(p => keptPhotos.includes(p));
            if (req.files && req.files.length > 0) {
                const newPhotos = req.files.map(file => `/uploads/${file.filename}`);
                photos = [...photos, ...newPhotos];
            }
        }


        const parsedAmenities = amenities ? JSON.parse(amenities) : property.amenities;

        await property.update({
            propertyName,
            description,
            category,
            location,
            price,
            priceUnit,
            dimensions,
            configuration,
            photos,
            projectName,
            amenities: parsedAmenities,
            status
        });

        res.json(property);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/properties/:id
// @desc    Delete property
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Delete associated records to avoid SQLITE_CONSTRAINT foreign key failure
        await Interaction.destroy({ where: { propertyId: property.id } });
        await Inquiry.destroy({ where: { propertyId: property.id } });

        await property.destroy();
        res.json({ message: 'Property removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
