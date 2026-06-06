const express = require('express');
const router = express.Router();
const { Property, Interaction, Visitor, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

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
        if (!pData.coverPhoto) {
            const pName = getProjectName(pData);
            if (pName && projectCovers.has(pName)) {
                pData.coverPhoto = projectCovers.get(pName);
            }
        }
        return pData;
    });
};

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
            lat,
            lng,
            radius = 50, // default 50km
            page = 1,
            limit = 12,
            sortBy = 'createdAt',
            sortOrder = 'DESC',
            bhk,
            amenities,
            possessionStatus,
            furnishingStatus
        } = req.query;

        const where: any = {};

        // Geolocation filtering
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const searchRadius = parseFloat(radius);

        if (!isNaN(latitude) && !isNaN(longitude)) {
            // Approximation: 1 degree lat ≈ 111km
            const latDelta = searchRadius / 111;
            const lngDelta = searchRadius / (111 * Math.abs(Math.cos(latitude * Math.PI / 180)));

            where.latitude = { [Op.between]: [latitude - latDelta, latitude + latDelta] };
            where.longitude = { [Op.between]: [longitude - lngDelta, longitude + lngDelta] };
        }

        // Default to showing several active statuses if none specified
        if (status) {
            where.status = status;
        } else {
            where.status = { [Op.in]: ['Available', 'Sold', 'EOI', 'RTMI'] };
        }

        if (city) {
            // Normalize Bangalore/Bengaluru
            if (city.toLowerCase().includes('bangalore') || city.toLowerCase().includes('bengaluru')) {
                where.location = {
                    [Op.or]: [
                        { [Op.like]: `%Bangalore%` },
                        { [Op.like]: `%Bengaluru%` }
                    ]
                };
            } else {
                where.location = { [Op.like]: `%${city}%` };
            }
        }

        if (category) {
            const categoryList = category.split(',');
            where.category = { [Op.in]: categoryList };
        }

        if (req.query.configurations) {
            const configList = req.query.configurations.split(',');
            if (!where[Op.and]) where[Op.and] = [];
            const configOrs = configList.map((c: string) => ({
                configuration: { [Op.like]: `%${c}%` }
            }));
            where[Op.and].push({ [Op.or]: configOrs });
        }

        if (req.query.dimension) {
            const dimList = req.query.dimension.split(',');
            if (dimList.length > 0) {
                if (!where[Op.and]) where[Op.and] = [];
                const dimOrs = dimList.map(d => ({
                    dimensions: { [Op.like]: `%${d}%` }
                }));
                where[Op.and].push({ [Op.or]: dimOrs });
            }
        }

        if (bhk) {
            const bhkList = bhk.split(',').map(Number);
            where.bhk = { [Op.in]: bhkList };
        }

        if (possessionStatus) {
            const pList = possessionStatus.split(',');
            where.possessionStatus = { [Op.in]: pList };
        }

        if (furnishingStatus) {
            const fList = furnishingStatus.split(',');
            where.furnishingStatus = { [Op.in]: fList };
        }

        // Amenities are harder in SQLite with JSON, we do a basic LIKE search for each
        if (amenities) {
            const amList = amenities.split(',');
            if (!where[Op.and]) where[Op.and] = [];
            amList.forEach(am => {
                where[Op.and].push({
                    amenities: { [Op.like]: `%${am}%` }
                });
            });
        }

        if (minPrice || maxPrice) {
            const min = parseFloat(minPrice);
            const max = parseFloat(maxPrice);

            const logger = require('../config/logger');
            logger.info('Backend Filter Requested: min=%s, max=%s', minPrice, maxPrice);

            if (!where[Op.and]) where[Op.and] = [];

            const normalizedPriceSql = `(
                CASE 
                    WHEN priceUnit = 'Cr' THEN CAST(price AS DECIMAL) * 10000000 
                    WHEN priceUnit = 'Lakhs' THEN CAST(price AS DECIMAL) * 100000 
                    WHEN priceUnit = 'Thousands' THEN CAST(price AS DECIMAL) * 1000 
                    ELSE CAST(price AS DECIMAL) 
                END
            )`;

            if (!isNaN(min)) {
                where[Op.and].push(sequelize.where(sequelize.literal(normalizedPriceSql), { [Op.gte]: min }));
            }
            if (!isNaN(max)) {
                where[Op.and].push(sequelize.where(sequelize.literal(normalizedPriceSql), { [Op.lte]: max }));
            }
        }

        if (search) {
            let locationSearch: any = { [Op.like]: `%${search}%` };
            if (search.toLowerCase().includes('bangalore') || search.toLowerCase().includes('bengaluru')) {
                locationSearch = {
                    [Op.or]: [
                        { [Op.like]: `%Bangalore%` },
                        { [Op.like]: `%Bengaluru%` }
                    ]
                };
            }

            where[Op.or] = [
                { propertyName: { [Op.like]: `%${search}%` } },
                { location: locationSearch },
                { description: { [Op.like]: `%${search}%` } },
                { projectName: { [Op.like]: `%${search}%` } },
                { category: { [Op.like]: `%${search}%` } },
            ];
        }

        console.log('Search Params:', req.query);
        console.log('Source Where Clause:', JSON.stringify(where, null, 2));

        const offset = (parseInt(page) - 1) * parseInt(limit);

        let orderClause = [[sortBy, sortOrder]];
        if (sortBy === 'price') {
            orderClause = [[sequelize.literal(`(
                CASE 
                    WHEN priceUnit = 'Cr' THEN CAST(price AS DECIMAL) * 10000000 
                    WHEN priceUnit = 'Lakhs' THEN CAST(price AS DECIMAL) * 100000 
                    WHEN priceUnit = 'Thousands' THEN CAST(price AS DECIMAL) * 1000 
                    ELSE CAST(price AS DECIMAL) 
                END
            )`), sortOrder]];
        } else if (sortBy === 'relevance') {
            // simplified relevance fallback to id or search match score (if implemented)
            orderClause = [['id', 'DESC']];
        }

        const { count, rows } = await Property.findAndCountAll({
            where,
            order: orderClause,
            limit: parseInt(limit),
            offset,
            logging: console.log // Log the actual SQL query
        });

        const enrichedRows = await enrichPropertiesWithCoverPhoto(rows);

        res.json({
            properties: enrichedRows,
            total: count,
            page: parseInt(page as string),
            totalPages: Math.ceil(count / parseInt(limit as string)),
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
        const { city, category, excludeCity } = req.query;
        let where: any = { status: { [Op.in]: ['Available', 'Sold', 'EOI', 'RTMI'] } };

        if (city && city !== 'All' && city !== 'Current Location' && city !== 'Your Area') {
            if (city.toLowerCase().includes('bangalore') || city.toLowerCase().includes('bengaluru')) {
                where.location = {
                    [Op.or]: [
                        { [Op.like]: `%Bangalore%` },
                        { [Op.like]: `%Bengaluru%` }
                    ]
                };
            } else {
                where.location = { [Op.like]: `%${city}%` };
            }
        }

        if (excludeCity && excludeCity !== 'All' && excludeCity !== 'Current Location' && excludeCity !== 'Your Area') {
            const isBangalore = excludeCity.toLowerCase().includes('bangalore') || excludeCity.toLowerCase().includes('bengaluru');

            if (isBangalore) {
                // If excluding Bangalore, exclude all variations
                const exclusion = {
                    [Op.and]: [
                        { [Op.notLike]: `%Bangalore%` },
                        { [Op.notLike]: `%Bengaluru%` },
                        { [Op.notLike]: `%Banglore%` } // Added common typo
                    ]
                };
                if (where.location) {
                    where.location = { [Op.and]: [where.location, exclusion] };
                } else {
                    where.location = exclusion;
                }
            } else {
                const exclusion = { [Op.notLike]: `%${excludeCity}%` };
                if (where.location) {
                    where.location = { [Op.and]: [where.location, exclusion] };
                } else {
                    where.location = exclusion;
                }
            }
        }

        if (category && category !== 'All') {
            const categoryList = (category as string).split(',');
            where.category = { [Op.in]: categoryList };
        }

        const properties = await Property.findAll({
            where,
            order: [['createdAt', 'DESC']]
        });
        const enrichedProperties = await enrichPropertiesWithCoverPhoto(properties);
        res.json(enrichedProperties);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/cities', async (req, res) => {
    try {
        // Fetch all properties with their location and projectName to group them
        const properties = await Property.findAll({
            attributes: ['location', 'projectName'],
            where: {
                status: { [Op.in]: ['Available', 'Sold', 'EOI', 'RTMI'] }
            }
        });

        // Use a map of sets to aggregate distinct project names per location
        const cityProjectMap = new Map<string, Set<string>>();

        properties.forEach(p => {
            const loc = (p.location || '').trim();
            if (!loc) return;

            // Group Bangalore variations
            const isBglr = loc.toLowerCase().includes('bangalore') || loc.toLowerCase().includes('bengaluru');
            const finalLoc = isBglr ? 'Bangalore' : loc;

            if (!cityProjectMap.has(finalLoc)) {
                cityProjectMap.set(finalLoc, new Set<string>());
            }
            
            if (p.projectName) {
                cityProjectMap.get(finalLoc)!.add(p.projectName);
            }
        });

        // Convert map back to array and count distinct projects
        const cities = Array.from(cityProjectMap, ([name, projectSet]) => ({
            name,
            propertyCount: projectSet.size // This now represents the count of unique projects
        })).sort((a, b) => b.propertyCount - a.propertyCount);

        res.json(cities);
    } catch (err) {
        console.error('Error fetching city counts:', err.message);
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

        const enrichedProperties = await enrichPropertiesWithCoverPhoto([property]);
        res.json(enrichedProperties[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
