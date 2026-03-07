require('dotenv').config();
const sequelize = require('./config/database');
const Property = require('./models/Property');

const apartments = [
    // 1. Sobha Town Park Phase 3
    ...[
        { conf: '1 BHK', dim: '753', price: 90 },
        { conf: '2 BHK', dim: '1240-1330', price: 1.74, unit: 'Cr' },
        { conf: '3 BHK', dim: '1514-1842', price: 2.12, unit: 'Cr' },
        { conf: '4 BHK', dim: '2203-2846', price: 3.08, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Sobha Town Park Phase 3 - ${d.conf} (${d.dim} sqft)`,
        projectName: 'Sobha Town Park Phase 3',
        description: 'Sobha Town Park Phase 3 is a luxury New York-themed residential development in Yadavanahalli.',
        category: 'Residential',
        location: 'Yadavanahalli, near Electronic City, Bengaluru.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 12.792653,
        longitude: 77.741068,
        reraNumber: 'PRM/KA/RERA/1251/308/PR/270922/005268',
        possessionTime: 'December 31, 2030',
        units: '560 units',
        floor: '1B + G + 37/38 Floors',
        landParcel: '33.7 acres'
    })),

    // 2. Abhee Celestial City Phase 2
    ...[
        { conf: '2 BHK + 2T', dim: '1340 – 1350', price: 1.31, unit: 'Cr' },
        { conf: '2.5 BHK (3 BHK+2T)', dim: '1680-1685', price: 1.63, unit: 'Cr' },
        { conf: '3 BHK (Medium)', dim: '1595-1700', price: 1.72, unit: 'Cr' },
        { conf: '3 BHK (Large)', dim: '1895-1990', price: 1.85, unit: 'Cr' },
        { conf: '4 BHK', dim: '2200-2454', price: 2.19, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Abhee Celestial City Phase 2 - ${d.conf}`,
        projectName: 'Abhee Celestial City Phase 2',
        description: 'Massive 50-acre premium township in Gunjur with 90% open space.',
        category: 'Residential',
        location: 'Whitefield–Sarjapur Main Road, East Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 12.904289,
        longitude: 77.748293,
        reraNumber: 'PRM/KA/RERA/1251/308/PR/071123/006380',
        possessionTime: 'June 2029',
        units: '400 units',
        floor: '2B + G + 35 Floors',
        landParcel: '50 acres'
    })),

    // 3. Sattva Lumina
    ...[
        { conf: '1 BHK', dim: '650-690', price: 62 },
        { conf: '2 BHK', dim: '1100-1150', price: 1.06, unit: 'Cr' },
        { conf: '3 BHK Regular', dim: '1450-1506', price: 1.39, unit: 'Cr' },
        { conf: '3 BHK Grand', dim: '1730-1809', price: 1.66, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Sattva Lumina - ${d.conf}`,
        projectName: 'Sattva Lumina',
        description: 'Luxury high-rise integrated township in Rajanukunte.',
        category: 'Residential',
        location: 'Doddaballapura Main Road, Rajanukunte, North Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.182122,
        longitude: 77.564163,
        reraNumber: 'PRM/KA/RERA/1251/472/PR/060924/007009',
        possessionTime: 'December 2028 to late 2029',
        units: '1,553 units',
        floor: '2B + G + 29 Floors',
        landParcel: '13.8 acres'
    })),

    // 4. Sattva Bliss
    ...[
        { conf: '1 BHK', dim: '542 to 546', price: 42.8 },
        { conf: '2 BHK', dim: '848 to 894', price: 67, unit: 'Lakhs' },
        { conf: '3 BHK', dim: '957 to 960', price: 76, unit: 'Lakhs' }
    ].map(d => ({
        propertyName: `Sattva Bliss - ${d.conf}`,
        projectName: 'Sattva Bliss',
        description: 'Premium residential development in East Bangalore corridor.',
        category: 'Residential',
        location: 'Nimbekaipura Road, East Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.063044,
        longitude: 77.746761,
        reraNumber: 'PRM/KA/RERA/1251/446/PR/120123/005620',
        possessionTime: 'August 2027',
        units: '338 units',
        floor: 'Basement + Ground + 10 Floors',
        landParcel: '3.32 acres'
    })),

    // 5. The Prestige City Phase 2
    ...[
        { conf: '2 BHK + 2T', dim: '~1,150', price: 1.38 },
        { conf: '3 BHK + 2T', dim: '~1,500', price: 1.85 },
        { conf: '3 BHK + 3T', dim: '~1,800', price: 2.25 },
        { conf: '3 BHK + 3T + Home Office', dim: '~2,000', price: 2.89 }
    ].map(d => ({
        propertyName: `Prestige City 2.0 - ${d.conf}`,
        projectName: 'The Prestige City Phase 2',
        description: 'Premium expansion of the 180-acre integrated township on Sarjapur Road.',
        category: 'Residential',
        location: 'Sarjapur Road, Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 12.877699,
        longitude: 77.766295,
        reraNumber: 'PRM/KA/RERA/1251/308/PR/090222/004684',
        possessionTime: 'December 2029',
        units: '350+ units',
        floor: '2B + G + 26/27 Floors',
        landParcel: '10 acres'
    })),

    // 6. Hydenben Clifton
    ...[
        { conf: '2 BHK', dim: '765 – 1,178', price: 64 },
        { conf: '2.5 BHK', dim: '835 – 1,284', price: 75, unit: 'Lakhs' },
        { conf: '3 BHK', dim: '1,022 – 1,461', price: 92, unit: 'Lakhs' }
    ].map(d => ({
        propertyName: `Hydenben Clifton - ${d.conf}`,
        projectName: 'Hydenben Clifton',
        description: 'Premium, low-density residential development in Sadahalli.',
        category: 'Residential',
        location: 'Sadahalli, North Bengaluru.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.212146,
        longitude: 77.648805,
        reraNumber: 'PRM/KA/RERA/1250/303/PR/130525/007737',
        possessionTime: 'April 2028',
        units: '126 apartments',
        floor: 'G + 9 Floors',
        landParcel: '1.58 acres'
    })),

    // 7. Godrej Aveline
    ...[
        { conf: '3 BHK Premium', dim: '1600', price: 2.88 },
        { conf: '3 BHK Luxe', dim: '1900 - 2100', price: 3.42 },
        { conf: '3.5 BHK Luxe', dim: '2,150-2500', price: 3.87 },
        { conf: '4 / 4.5 BHK Luxe', dim: '2500-3000', price: 4.50 }
    ].map(d => ({
        propertyName: `Godrej Aveline - ${d.conf}`,
        projectName: 'Godrej Aveline',
        description: 'Upcoming ultra-luxury residential township on Airport Road.',
        category: 'Residential',
        location: 'Yelahanka, North Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.115330,
        longitude: 77.607627,
        reraNumber: 'PRM/KA/RERA/1251/472/PR/121125/008248',
        possessionTime: 'May 2030',
        units: '840 units',
        floor: '2B + G + 15 Floors',
        landParcel: '10 acres'
    })),

    // 8. Godrej Parkshire
    ...[
        { conf: '2 BHK Premium', dim: '1050-1095', price: 1.17 },
        { conf: '2 BHK Luxe', dim: '1200-1224', price: 1.34 },
        { conf: '3 BHK Premium', dim: '1600-1634', price: 1.78 },
        { conf: '3 BHK Luxe', dim: '1750-1804', price: 1.95 }
    ].map(d => ({
        propertyName: `Godrej Parkshire - ${d.conf}`,
        projectName: 'Godrej Parkshire',
        description: 'Luxury residential township in Hoskote with "Born Green" philosophy.',
        category: 'Residential',
        location: 'Hoskote, East Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.046680,
        longitude: 77.783796,
        reraNumber: 'PRM/KA/RERA/1250/304/PR/090126/008393',
        possessionTime: 'December 31, 2030',
        units: '1,132 units',
        floor: '2B + G + 28 Floors',
        landParcel: '13.5 acres'
    })),

    // 9. Sobha World City
    ...[
        { conf: '1 BHK', dim: '703-777', price: 85 },
        { conf: '2 BHK Small', dim: '1015-1050', price: 1.22, unit: 'Cr' },
        { conf: '2 BHK Large', dim: '1213-1350', price: 1.45, unit: 'Cr' },
        { conf: '3 BHK Smart', dim: '1445-1625', price: 1.73, unit: 'Cr' },
        { conf: '3 BHK Luxe', dim: '1675-1890', price: 2.01, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Sobha World City - ${d.conf}`,
        projectName: 'Sobha World City',
        description: 'Premier 300-acre township in Hoskote with high-rise apartments.',
        category: 'Residential',
        location: 'Old Madras Road (NH-75), East Bengaluru.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.057069,
        longitude: 77.773752,
        possessionTime: 'December 2030',
        units: '5,406 total units',
        floor: '3B + G + 54 Floors',
        landParcel: '300 acres'
    })),

    // 10. Embassy Lake Terraces
    ...[
        { conf: '3 BHK', dim: '3,500 - 3,897', price: 6.64 },
        { conf: '4 BHK', dim: '4,189 - 5,112', price: 7.95 },
        { conf: '5 BHK', dim: '8,331', price: 15.82 }
    ].map(d => ({
        propertyName: `Embassy Lake Terraces - ${d.conf}`,
        projectName: 'Embassy Lake Terraces',
        description: 'Iconic luxury residential landmark at Hebbal Junction.',
        category: 'Residential',
        location: 'Hebbal, North Bengaluru.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Ready to Move',
        latitude: 13.050034,
        longitude: 77.594497,
        reraNumber: 'PRM/KA/RERA/1251/309/PR/171016/000602',
        possessionTime: 'March 2021',
        units: '467 units',
        floor: '2B + G + 21 Floors',
        landParcel: '14.5 acres'
    })),

    // 11. Lodha Mirabelle Phase 2
    ...[
        { conf: '3 BHK', dim: '2,300', price: 2.96 },
        { conf: '3.5 BHK', dim: '2,400', price: 3.14 },
        { conf: '4.5 BHK', dim: '2,900 - 3,000', price: 3.81 }
    ].map(d => ({
        propertyName: `Lodha Mirabelle - ${d.conf}`,
        projectName: 'Lodha Mirabelle Phase 2',
        description: 'Exclusive luxury residential enclave in Manyata Tech Park.',
        category: 'Residential',
        location: 'Thanisandra, North Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.050725,
        longitude: 77.623922,
        reraNumber: 'PRM/KA/RERA/1251/446/PR/230425/007688',
        possessionTime: 'June 1, 2030',
        units: '284 units',
        floor: 'G + 39 floors',
        landParcel: '19.3 acres'
    })),

    // 12. L&T Elara Celestia
    ...[
        { conf: '3 BHK Standard', dim: '1,400 – 1,578', price: 2.7 },
        { conf: '3 BHK Large', dim: '1,900 – 2,206', price: 3.15 },
        { conf: '4 BHK Standard', dim: '2,600 – 2,849', price: 4.31 },
        { conf: '4 BHK Large', dim: '2,935 – 3,162', price: 4.87 },
        { conf: '5 BHK Duplex', dim: '3,600 – 5,591', price: 5.97 }
    ].map(d => ({
        propertyName: `L&T Elara Celestia - ${d.conf}`,
        projectName: 'L&T Elara Celestia',
        description: 'Ultra-luxury residential landmark in Hebbal.',
        category: 'Residential',
        location: 'Hebbal, North Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.072030,
        longitude: 77.590707,
        reraNumber: 'PRM/KA/RERA/1251/472/PR/100325/007564',
        possessionTime: 'March 31, 2030',
        units: '634 units',
        floor: '2B + G + 13 Storeys',
        landParcel: '10 acres'
    })),

    // 13. Brigade Insignia
    ...[
        { conf: '3 BHK', dim: '2,145 to 2,481', price: 2.99 },
        { conf: '4 BHK', dim: '3,066 to 3,114', price: 4.32 },
        { conf: '5 BHK', dim: '4,137 to 5,947', price: 5.85 }
    ].map(d => ({
        propertyName: `Brigade Insignia - ${d.conf}`,
        projectName: 'Brigade Insignia',
        description: 'Ultra-luxury, low-density residential enclave in Yelahanka.',
        category: 'Residential',
        location: 'Yelahanka, North Bengaluru.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 13.110300,
        longitude: 77.606669,
        reraNumber: 'PRM/KA/RERA/1251/309/PR/180524/006894',
        possessionTime: 'December 2028',
        units: '379 units',
        floor: '2B + S + 15 Floors',
        landParcel: '6 acres'
    })),

    // 14. Nambiar District 25
    ...[
        { conf: '1 BHK', dim: '750', price: 93.75, unit: 'Lakhs' },
        { conf: '2 BHK', dim: '1195-1323', price: 1.58, unit: 'Cr' },
        { conf: '2.5 BHK', dim: '1375-1477', price: 1.82, unit: 'Cr' },
        { conf: '3 BHK (2T)', dim: '1400-1581', price: 1.85, unit: 'Cr' },
        { conf: '3 BHK (3T)', dim: '1500-1948', price: 1.98, unit: 'Cr' },
        { conf: '3.5 BHK', dim: '2002-2561', price: 2.65, unit: 'Cr' },
        { conf: '4 BHK', dim: '2400-2995', price: 3.18, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Nambiar District 25 - ${d.conf}`,
        projectName: 'Nambiar District 25',
        description: 'Massive 100-acre integrated township on Sarjapur Road.',
        category: 'Residential',
        location: 'Muthanallur Cross, Sarjapur Road, Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Cr',
        dimensions: `${d.dim} sqft`,
        configuration: d.conf,
        status: 'Available',
        latitude: 12.874854,
        longitude: 77.734856,
        reraNumber: 'PRM/KA/RERA/1251/308/PR/200825/008011',
        possessionTime: 'September 5, 2030',
        units: '5,660 units',
        floor: '2B + G + 32/33 Floors',
        landParcel: '100 acres'
    })),
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        for (const apt of apartments) {
            await Property.create(apt);
            console.log(`Created: ${apt.propertyName}`);
        }

        console.log(`Seeding completed. Total apartments added: ${apartments.length}`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
