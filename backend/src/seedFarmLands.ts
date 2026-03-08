require('dotenv').config();
const sequelize = require('./config/database');
const Property = require('./models/Property');

const farmLands = [
    // 1. Brindavan
    ...[
        { dim: '6,000', price: 26.5 },
        { dim: '8,000', price: 35.5 },
        { dim: '10,000', price: 44.4 },
        { dim: '~10,890', price: 48 },
        { dim: '~21,780', price: 96 },
        { dim: '~43,560', price: 1.75, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Brindavan - ${d.dim} sq.ft.`,
        projectName: 'Brindavan',
        description: 'Brindavan is a 30-acre spiritually-inspired sanctuary in Ramanagara featuring fruit orchards and a gaushala.',
        category: 'Farm Land',
        location: 'Sathanur, Ramanagara.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.501942,
        longitude: 77.321753,
        possessionTime: 'July 2024',
        units: '150 to 180 units',
        landParcel: '30 acres'
    })),

    // 2. Parva
    ...[
        { dim: '~6,000', price: 35.94 },
        { dim: '10,890', price: 65.23 },
        { dim: '21,780', price: 1.30, unit: 'Cr' },
        { dim: '32,670', price: 1.95, unit: 'Cr' },
        { dim: '43,560', price: 2.60, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Parva - ${d.dim} sq.ft.`,
        projectName: 'Parva',
        description: 'Parva by Hasiru Farms is a 17-acre theme-based managed farmland project near Kanakapura.',
        category: 'Farm Land',
        location: 'Kanakapura Road, South Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.484051,
        longitude: 77.289514,
        possessionTime: 'April 20, 2025',
        units: '30+ exclusive farm land',
        landParcel: '17 Acres'
    })),

    // 3. Vihaar
    {
        propertyName: 'Vihaar - 6,000 sq.ft.',
        projectName: 'Vihaar',
        description: 'Vihaar is a 15-acre managed farmland and luxury eco-retreat in the Belur–Sakleshpur corridor.',
        category: 'Farm Land',
        location: 'Belur–Sakleshpur corridor, Karnataka.',
        price: 15,
        priceUnit: 'Lakhs',
        dimensions: '6,000',
        status: 'Available',
        latitude: 13.160044,
        longitude: 75.859989,
        possessionTime: 'Ready to Register',
        landParcel: '15 acres'
    },

    // 4. Prakruthi
    ...[
        { dim: '~5,500', price: 33 },
        { dim: '~6,500', price: 37 },
        { dim: '~10,890', price: 48 },
        { dim: '~21,780', price: 90 },
        { dim: '~43,560', price: 0, unit: 'Request' }
    ].map(d => ({
        propertyName: `Prakruthi - ${d.dim} sq.ft.`,
        projectName: 'Prakruthi',
        description: 'Prakruthi is a 33-acre village-themed managed farmland near Kanakapura.',
        category: 'Farm Land',
        location: 'Kanakapura.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.5476,
        longitude: 77.4243,
        possessionTime: 'Ready to Register',
        landParcel: '33 acres'
    })),

    // 5. Raaga
    {
        propertyName: 'Raaga - 8,000 sq.ft.',
        projectName: 'Raaga',
        description: 'Raaga is a managed farmland project in Kanakapura that integrates Ayurvedic landscapes.',
        category: 'Farm Land',
        location: 'Kanakapura, Bangalore.',
        price: 47.92,
        priceUnit: 'Lakhs',
        dimensions: '8,000',
        status: 'Available',
        latitude: 12.390871,
        longitude: 77.362648,
        possessionTime: 'Ready to Register',
        landParcel: '17 acres'
    },

    // 6. Hosachiguru Eco Habitat
    ...[
        { dim: '~10,890', price: 32.95 },
        { dim: '~21,780', price: 65 },
        { dim: '~43,560', price: 1.30, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Hosachiguru Eco Habitat - ${d.dim} sq.ft.`,
        projectName: 'Hosachiguru Eco Habitat',
        description: 'Hosachiguru Eco Habitat is a premium 20-acre managed farmland community near Hindupur.',
        category: 'Farm Land',
        location: 'Chalivendala, near Hindupur.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.8450,
        longitude: 77.5620,
        possessionTime: 'Ready to Register',
        units: '43 units',
        landParcel: '30 acres'
    })),

    // 7. Whistling Woods
    ...[
        { dim: '~5,400', price: 48.55 },
        { dim: '~5,500', price: 54.00 },
        { dim: '~10,000', price: 89.90 },
        { dim: '~15,000', price: 1.35, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Whistling Woods - ${d.dim} sq.ft.`,
        projectName: 'Whistling Woods',
        description: 'Whistling Woods by Delight Eco Farms is a premium 150-acre managed farmland project in Sakleshpur.',
        category: 'Farm Land',
        location: 'Ballupet, Sakleshpur.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.9238,
        longitude: 75.8770,
        possessionTime: 'March 2030',
        landParcel: '150 acres'
    })),

    // 8. Vanam
    ...[
        { dim: '6,000', price: 29.88 },
        { dim: '8,000', price: 39.92 },
        { dim: '10,000', price: 49.90 }
    ].map(d => ({
        propertyName: `Vanam - ${d.dim} sq.ft.`,
        projectName: 'Vanam',
        description: 'Vanam by Delight Eco Farms is an Ayurvedic-themed farmland project designed for sustainable living.',
        category: 'Farm Land',
        location: 'Kanakapura Road, Bangalore South.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.39,
        longitude: 77.36,
        possessionTime: 'Ready to Register',
        landParcel: '6 acres'
    })),

    // 9. Ayana
    ...[
        { dim: '~5,500', price: 27 },
        { dim: '~10,000', price: 50 },
        { dim: '~15,000+', price: 75 }
    ].map(d => ({
        propertyName: `Ayana - ${d.dim} sq.ft.`,
        projectName: 'Ayana',
        description: 'Ayana by Delight Eco Farms is an exclusive managed farmland project in Sakleshpur.',
        category: 'Farm Land',
        location: 'Sakleshpur.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.02,
        longitude: 75.85,
        possessionTime: 'Ready to Register',
        landParcel: '25-acre'
    })),

    // 10. Rhythm of Soul
    ...[
        { dim: '5,500', price: 37.5 },
        { dim: '10,000', price: 50 },
        { dim: '10,890', price: 54 }
    ].map(d => ({
        propertyName: `Rhythm of Soul - ${d.dim} sq.ft.`,
        projectName: 'Rhythm of Soul',
        description: 'Rhythm of Soul is a 50-acre, music-and-wellness-themed managed farmland community in Sakleshpur.',
        category: 'Farm Land',
        location: 'Hirivate region of Sakleshpur.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.9453,
        longitude: 75.7790,
        possessionTime: 'March 2030',
        units: '221 managed farm plots',
        landParcel: '50-acre'
    })),

    // 11. Arinaa Country Farms
    ...[
        { dim: '5,659', price: 33.95 },
        { dim: '10890', price: 65.23 },
        { dim: '14429', price: 86.43 },
        { dim: '16247', price: 97.31 }
    ].map(d => ({
        propertyName: `Arinaa Country Farms - ${d.dim} sq.ft.`,
        projectName: 'Arinaa Country Farms',
        description: 'Arinaa Country Farms is a 15-acre gated managed farmland project in Kanakapura.',
        category: 'Farm Land',
        location: 'Seegekote near Kanakapura.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.55,
        longitude: 77.417,
        possessionTime: 'October 2022',
        units: '99 units',
        landParcel: '15 Acres'
    })),

    // 12. Bellevuee
    ...[
        { dim: '6000', price: 35.94 },
        { dim: '6100', price: 36.54 },
        { dim: '6400', price: 38.34 },
        { dim: '7000', price: 41.93 },
        { dim: '8000', price: 47.92 },
        { dim: '9000', price: 53.91 }
    ].map(d => ({
        propertyName: `Bellevuee - ${d.dim} sq.ft.`,
        projectName: 'Bellevuee',
        description: 'Delight Arinaa Bellevuee is a managed farmland project on Kanakapura Road.',
        category: 'Farm Land',
        location: 'Keralalusandra Village near Kanakapura.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.5647,
        longitude: 77.4121,
        possessionTime: 'June 2026',
        units: '99 units',
        landParcel: '27 acres'
    })),

    // 13. Canvas Lepakshi
    ...[
        { dim: '5,500', price: 27.17 },
        { dim: '15,000', price: 0, unit: 'Request' }
    ].map(d => ({
        propertyName: `Canvas Lepakshi - ${d.dim} sq.ft.`,
        projectName: 'Canvas Lepakshi',
        description: 'Canvas Lepakshi is a 120-acre sustainable farmland project in Kallur Village.',
        category: 'Farm Land',
        location: 'Lepakshi, Andhra Pradesh.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.8415,
        longitude: 77.5746,
        possessionTime: 'March 2030',
        landParcel: '120 acres'
    })),

    // 14. Dhatri Sandal Farms
    ...[
        { dim: '10,890', price: 27.12 },
        { dim: '6,000', price: 13.61 },
        { dim: '4,500', price: 11.21 }
    ].map(d => ({
        propertyName: `Dhatri Sandal Farms - ${d.dim} sq.ft.`,
        projectName: 'Dhatri Sandal Farms',
        description: 'Dhatri Sandal Farms is a 106-acre managed agricultural project specialized in sandalwood.',
        category: 'Farm Land',
        location: 'Lepakshi, Hindupur.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.8041,
        longitude: 77.5855,
        possessionTime: 'Ready to Register',
        units: '99+ farm lands',
        landParcel: '106 acres'
    })),

    // 15. Heritage Sovereign
    {
        propertyName: 'Heritage Sovereign - 10,890 sq.ft.',
        projectName: 'Heritage Sovereign',
        description: 'Heritage Sovereign is an exclusive 15-acre managed farmland project in Madikeri, Coorg.',
        category: 'Farm Land',
        location: 'Madikeri, Coorg.',
        price: 60.98,
        priceUnit: 'Lakhs',
        dimensions: '10,890',
        status: 'Available',
        latitude: 12.4325,
        longitude: 75.7516,
        possessionTime: 'Ready to Register',
        units: '99+ farm lands',
        landParcel: '15-acre'
    },

    // 16. Ecopia
    {
        propertyName: 'Ecopia - 5,445 sq.ft.',
        projectName: 'Ecopia',
        description: 'Ecopia is a 32-acre premium managed farmland project in Gonikoppa, Coorg.',
        category: 'Farm Land',
        location: 'Gonikoppa, Coorg.',
        price: 38.06,
        priceUnit: 'Lakhs',
        dimensions: '5,445',
        status: 'Available',
        latitude: 12.1833,
        longitude: 75.9276,
        possessionTime: 'Ready to Register',
        units: '99+ farm lands',
        landParcel: '32 Acres'
    },

    // 17. The Roots by Nature's Cluster
    ...[
        { dim: '5,500', price: 24.70 },
        { dim: '6,000+', price: 26.94 }
    ].map(d => ({
        propertyName: `The Roots - ${d.dim} sq.ft.`,
        projectName: "The Roots by Nature's Cluster",
        description: "The Roots is a 20-acre managed farmland project in Channapatna.",
        category: 'Farm Land',
        location: 'Kanchanahalli, near Channapatna.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.6530,
        longitude: 77.2050,
        possessionTime: 'Ready to Register',
        units: '99+ farm lands',
        landParcel: '20-acre'
    })),

    // 18. Gandhapallavi Farms
    {
        propertyName: 'Gandhapallavi Farms - 5,718 sq.ft.',
        projectName: 'Gandhapallavi Farms',
        description: 'Managed farmland in Godageri, approximately 5,718 square feet per plot.',
        category: 'Farm Land',
        location: 'Godageri, Karnataka.',
        price: 10.00,
        priceUnit: 'Lakhs',
        dimensions: '5,718',
        status: 'Available',
        latitude: 15.4591,
        longitude: 75.0160,
        possessionTime: 'Ready to Register',
        units: '35 to 40 farm lands',
        landParcel: '20 acres'
    },

    // 19. Parivara
    ...[
        { dim: '~5,989', price: 0, unit: 'Request' },
        { dim: '~10,890', price: 21.5 },
        { dim: '~21,780', price: 0, unit: 'Request' },
        { dim: '~43,560', price: 0, unit: 'Request' }
    ].map(d => ({
        propertyName: `Parivara - ${d.dim} sq.ft.`,
        projectName: 'Parivara',
        description: 'Parivara by Hasiru Farms is a 10-acre managed farmland and resort project near Kanakapura.',
        category: 'Farm Land',
        location: 'Kanakapura, Sathnur.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.9161,
        longitude: 77.5205,
        possessionTime: 'Ready to Register',
        units: '40 farm plots',
        landParcel: '10 acres'
    })),
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        console.log('Database path:', sequelize.options.storage);

        // Sync to ensure table exists
        await sequelize.sync();

        for (const farm of farmLands) {
            await Property.create(farm);
            console.log(`Created: ${farm.propertyName}`);
        }

        console.log(`Seeding completed. Total farm lands added: ${farmLands.length}`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
