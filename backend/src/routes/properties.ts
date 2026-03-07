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
router.post('/', [auth, upload.fields([{ name: 'photos', maxCount: 100 }, { name: 'brochure', maxCount: 10 }, { name: 'floorPlan', maxCount: 10 }])], async (req, res) => {
    try {
        const { propertyName, description, category, location, price, priceUnit, dimensions, configuration, projectName, amenities, status, reraNumber, builderInfo, isVerified, projectHighlights, possessionStatus, furnishingStatus, bhk, latitude, longitude, possessionTime, developerName, landParcel, floor, units, investmentType } = req.body;

        const photos = req.files && req.files['photos'] ? req.files['photos'].map((file: any) => `/uploads/${file.filename}`) : [];
        const brochure = req.files && req.files['brochure'] ? req.files['brochure'].map((file: any) => `/uploads/${file.filename}`) : [];
        const floorPlan = req.files && req.files['floorPlan'] ? req.files['floorPlan'].map((file: any) => `/uploads/${file.filename}`) : [];
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
            brochure,
            floorPlan,
            projectName,
            amenities: parsedAmenities,
            status,
            reraNumber,
            builderInfo,
            isVerified: isVerified === 'true' || isVerified === true,
            projectHighlights: projectHighlights ? JSON.parse(projectHighlights) : [],
            possessionStatus,
            furnishingStatus,
            bhk,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            possessionTime,
            developerName,
            landParcel,
            floor,
            units,
            investmentType
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
router.put('/:id', [auth, upload.fields([{ name: 'photos', maxCount: 100 }, { name: 'brochure', maxCount: 10 }, { name: 'floorPlan', maxCount: 10 }])], async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        const { propertyName, description, category, location, price, priceUnit, dimensions, configuration, projectName, amenities, status, existingPhotos, existingBrochure, existingFloorPlan, reraNumber, builderInfo, isVerified, projectHighlights, possessionStatus, furnishingStatus, bhk, latitude, longitude, possessionTime, developerName, landParcel, floor, units, investmentType } = req.body;

        let photos = property.photos || [];
        let brochure = property.brochure || [];
        let floorPlan = property.floorPlan || [];

        // Handle existing
        if (existingPhotos) {
            const keptPhotos = Array.isArray(existingPhotos) ? existingPhotos : [existingPhotos];
            photos = photos.filter((p: string) => keptPhotos.includes(p));
        } else { photos = []; }

        if (existingBrochure) {
            const keptBrochure = Array.isArray(existingBrochure) ? existingBrochure : [existingBrochure];
            brochure = brochure.filter((p: string) => keptBrochure.includes(p));
        } else { brochure = []; }

        if (existingFloorPlan) {
            const keptFloorPlan = Array.isArray(existingFloorPlan) ? existingFloorPlan : [existingFloorPlan];
            floorPlan = floorPlan.filter((p: string) => keptFloorPlan.includes(p));
        } else { floorPlan = []; }

        // Handle new files
        if (req.files && req.files['photos']) {
            const newPhotos = req.files['photos'].map((file: any) => `/uploads/${file.filename}`);
            photos = [...photos, ...newPhotos];
        }
        if (req.files && req.files['brochure']) {
            const newBrochures = req.files['brochure'].map((file: any) => `/uploads/${file.filename}`);
            brochure = [...brochure, ...newBrochures];
        }
        if (req.files && req.files['floorPlan']) {
            const newFloorPlans = req.files['floorPlan'].map((file: any) => `/uploads/${file.filename}`);
            floorPlan = [...floorPlan, ...newFloorPlans];
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
            brochure,
            floorPlan,
            projectName,
            amenities: parsedAmenities,
            status,
            reraNumber,
            builderInfo,
            isVerified: isVerified === 'true' || isVerified === true,
            projectHighlights: projectHighlights ? typeof projectHighlights === 'string' ? JSON.parse(projectHighlights) : projectHighlights : property.projectHighlights,
            possessionStatus,
            furnishingStatus,
            bhk,
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            possessionTime,
            developerName,
            landParcel,
            floor,
            units,
            investmentType
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
