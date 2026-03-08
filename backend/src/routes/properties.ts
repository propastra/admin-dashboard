const express = require('express');
const router = express.Router();
const { Property, Interaction, Inquiry } = require('../models');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../../uploads/');
        cb(null, uploadPath);
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
        console.error('Error fetching all properties:', err);
        res.status(500).json({ message: 'Server error fetching properties', error: err.message });
    }
});

// @route   GET api/properties/:id
// @desc    Get property by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        // Record View Interaction - Wrapped in try-catch to prevent main request failure
        try {
            await Interaction.create({
                interactionType: 'View',
                propertyId: property.id,
                metadata: { source: 'admin_dashboard_detail' }
            });
        } catch (interactionErr) {
            console.error('Failed to record interaction:', interactionErr.message);
            // Non-blocking error
        }

        res.json(property);
    } catch (err) {
        console.error(`Error fetching property ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error fetching property detail', error: err.message });
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

        let parsedAmenities = [];
        try {
            parsedAmenities = amenities ? JSON.parse(amenities) : [];
        } catch (e) {
            console.error('Error parsing amenities JSON:', e.message);
            parsedAmenities = amenities ? amenities.split(',').map((s: string) => s.trim()) : [];
        }

        let parsedHighlights = [];
        try {
            parsedHighlights = projectHighlights ? JSON.parse(projectHighlights) : [];
        } catch (e) {
            console.error('Error parsing projectHighlights JSON:', e.message);
        }

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
            projectHighlights: parsedHighlights,
            possessionStatus,
            furnishingStatus,
            bhk: bhk ? parseInt(bhk) : null,
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
        console.error('Error creating property:', err);
        res.status(500).json({ message: 'Server error creating property', error: err.message });
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

        // Handle existing - FIXED: if undefined, it might mean no changes or it might mean cleared. 
        // In multipart form, if empty it might not be sent.
        if ('existingPhotos' in req.body) {
            const keptPhotos = Array.isArray(existingPhotos) ? existingPhotos : (existingPhotos ? [existingPhotos] : []);
            photos = photos.filter((p: string) => keptPhotos.includes(p));
        }

        if ('existingBrochure' in req.body) {
            const keptBrochure = Array.isArray(existingBrochure) ? existingBrochure : (existingBrochure ? [existingBrochure] : []);
            brochure = brochure.filter((p: string) => keptBrochure.includes(p));
        }

        if ('existingFloorPlan' in req.body) {
            const keptFloorPlan = Array.isArray(existingFloorPlan) ? existingFloorPlan : (existingFloorPlan ? [existingFloorPlan] : []);
            floorPlan = floorPlan.filter((p: string) => keptFloorPlan.includes(p));
        }

        // Handle new files
        if (req.files) {
            if (req.files['photos']) {
                const newPhotos = req.files['photos'].map((file: any) => `/uploads/${file.filename}`);
                photos = [...photos, ...newPhotos];
            }
            if (req.files['brochure']) {
                const newBrochures = req.files['brochure'].map((file: any) => `/uploads/${file.filename}`);
                brochure = [...brochure, ...newBrochures];
            }
            if (req.files['floorPlan']) {
                const newFloorPlans = req.files['floorPlan'].map((file: any) => `/uploads/${file.filename}`);
                floorPlan = [...floorPlan, ...newFloorPlans];
            }
        }

        let parsedAmenities = property.amenities;
        if (amenities) {
            try {
                parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
            } catch (e) {
                parsedAmenities = amenities.split(',').map((s: string) => s.trim());
            }
        }

        let parsedHighlights = property.projectHighlights;
        if (projectHighlights) {
            try {
                parsedHighlights = typeof projectHighlights === 'string' ? JSON.parse(projectHighlights) : projectHighlights;
            } catch (e) {
                console.error('Error parsing highlights:', e.message);
            }
        }

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
            projectHighlights: parsedHighlights,
            possessionStatus,
            furnishingStatus,
            bhk: bhk ? parseInt(bhk) : null,
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
        console.error(`Error updating property ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error updating property', error: err.message });
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
        console.error(`Error deleting property ${req.params.id}:`, err);
        res.status(500).json({ message: 'Server error deleting property', error: err.message });
    }
});

module.exports = router;
