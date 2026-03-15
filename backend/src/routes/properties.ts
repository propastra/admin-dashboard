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
router.post('/', [auth, upload.fields([{ name: 'photos', maxCount: 100 }, { name: 'brochure', maxCount: 10 }, { name: 'floorPlan', maxCount: 10 }, { name: 'masterPlan', maxCount: 10 }])], async (req, res) => {
    try {
        const { propertyName, description, category, location, price, priceUnit, dimensions, configuration, projectName, amenities, status, reraNumber, builderInfo, isVerified, projectHighlights, possessionStatus, furnishingStatus, bhk, latitude, longitude, possessionTime, developerName, developerId, landParcel, floor, units, investmentType } = req.body;

        const masterPlan = req.files && req.files['masterPlan'] ? (req.files['masterPlan'] as any[]).map((file: any) => `/uploads/${file.filename}`) : [];
        const photos = req.files && req.files['photos'] ? (req.files['photos'] as any[]).map((file: any) => `/uploads/${file.filename}`) : [];
        const brochure = req.files && req.files['brochure'] ? (req.files['brochure'] as any[]).map((file: any) => `/uploads/${file.filename}`) : [];
        const floorPlan = req.files && req.files['floorPlan'] ? (req.files['floorPlan'] as any[]).map((file: any) => `/uploads/${file.filename}`) : [];

        let parsedAmenities = [];
        try {
            parsedAmenities = amenities ? JSON.parse(amenities) : [];
        } catch (e) {
            console.error('Error parsing amenities JSON:', e.message);
            parsedAmenities = amenities ? (amenities as string).split(',').map((s: string) => s.trim()) : [];
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
            masterPlan,
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
            developerId,
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

// @route   POST api/properties/bulk
// @desc    Add multiple properties via bulk JSON payload
// @access  Private
router.post('/bulk', auth, async (req, res) => {
    try {
        const { properties } = req.body;
        if (!Array.isArray(properties) || properties.length === 0) {
            return res.status(400).json({ message: 'Properties array is required' });
        }

        const createdProperties = await Property.bulkCreate(properties.map(p => ({
            ...p,
            photos: [],
            brochure: [],
            floorPlan: [],
            masterPlan: [],
            amenities: Array.isArray(p.amenities) ? p.amenities : (p.amenities ? String(p.amenities).split(',').map(s => s.trim()) : []),
            projectHighlights: Array.isArray(p.projectHighlights) ? p.projectHighlights : (p.projectHighlights ? String(p.projectHighlights).split(',').map(s => s.trim()) : []),
            isVerified: p.isVerified === 'true' || p.isVerified === true,
            bhk: p.bhk ? parseInt(p.bhk) : null,
            latitude: p.latitude ? parseFloat(p.latitude) : null,
            longitude: p.longitude ? parseFloat(p.longitude) : null,
        })));

        res.json({ 
            message: `Successfully imported ${createdProperties.length} properties`, 
            count: createdProperties.length,
            importedIds: createdProperties.map(p => p.id)
        });
    } catch (err) {
        console.error('Error in bulk import:', err);
        res.status(500).json({ message: 'Server error during bulk import', error: err.message });
    }
});

// @route   DELETE api/properties/bulk
// @desc    Revert/delete multiple properties via bulk JSON payload of IDs
// @access  Private
router.delete('/bulk', auth, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Array of property IDs is required' });
        }

        const deletedCount = await Property.destroy({
            where: {
                id: ids
            }
        });

        res.json({ message: `Successfully reverted ${deletedCount} properties`, count: deletedCount });
    } catch (err) {
        console.error('Error reverting bulk import:', err);
        res.status(500).json({ message: 'Server error reverting bulk import', error: err.message });
    }
});
// @route   PUT api/properties/:id
// @desc    Update property
// @access  Private
router.put('/:id', [auth, upload.fields([{ name: 'photos', maxCount: 100 }, { name: 'brochure', maxCount: 10 }, { name: 'floorPlan', maxCount: 10 }, { name: 'masterPlan', maxCount: 10 }])], async (req, res) => {
    try {
        const property = await Property.findByPk(req.params.id);
        if (!property) return res.status(404).json({ message: 'Property not found' });

        const { propertyName, description, category, location, price, priceUnit, dimensions, configuration, projectName, amenities, status, existingPhotos, existingBrochure, existingFloorPlan, existingMasterPlan, reraNumber, builderInfo, isVerified, projectHighlights, possessionStatus, furnishingStatus, bhk, latitude, longitude, possessionTime, developerName, developerId, landParcel, floor, units, investmentType } = req.body;

        let photos = property.photos || [];
        let brochure = property.brochure || [];
        let floorPlan = property.floorPlan || [];
        let masterPlan = property.masterPlan || [];

        // Handle existing
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

        if ('existingMasterPlan' in req.body) {
            const keptMasterPlan = Array.isArray(existingMasterPlan) ? existingMasterPlan : (existingMasterPlan ? [existingMasterPlan] : []);
            masterPlan = masterPlan.filter((p: string) => keptMasterPlan.includes(p));
        }

        // Handle new files
        if (req.files) {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] };
            if (files['photos']) {
                const newPhotos = files['photos'].map((file: any) => `/uploads/${file.filename}`);
                photos = [...photos, ...newPhotos];
            }
            if (files['brochure']) {
                const newBrochures = files['brochure'].map((file: any) => `/uploads/${file.filename}`);
                brochure = [...brochure, ...newBrochures];
            }
            if (files['floorPlan']) {
                const newFloorPlans = files['floorPlan'].map((file: any) => `/uploads/${file.filename}`);
                floorPlan = [...floorPlan, ...newFloorPlans];
            }
            if (files['masterPlan']) {
                const newMasterPlans = files['masterPlan'].map((file: any) => `/uploads/${file.filename}`);
                masterPlan = [...masterPlan, ...newMasterPlans];
            }
        }

        let parsedAmenities = property.amenities;
        if (amenities) {
            try {
                parsedAmenities = typeof amenities === 'string' ? JSON.parse(amenities) : amenities;
            } catch (e) {
                parsedAmenities = (amenities as string).split(',').map((s: string) => s.trim());
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
            masterPlan,
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
            developerId,
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
