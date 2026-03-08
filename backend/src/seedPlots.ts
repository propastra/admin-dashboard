require('dotenv').config();
const sequelize = require('./config/database');
const Property = require('./models/Property');

const plots = [
    // 1. Prestige Kings County
    ...[
        { dim: '1,200', price: 1.02 },
        { dim: '1,500', price: 1.25 },
        { dim: '1,800', price: 1.53 },
        { dim: '2,000', price: 1.70 },
        { dim: '2,400', price: 2.04 },
        { dim: '3,000+', price: 2.55 }
    ].map(d => ({
        propertyName: `Prestige Kings County - ${d.dim} sq.ft.`,
        projectName: 'Prestige Kings County',
        description: 'Prestige Kings County is a premium, 73-acre RERA-approved plotted development by the Prestige Group near Electronic City IT hub.',
        category: 'Plot',
        location: 'Rajapura-Jigani area, South Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.784147,
        longitude: 77.657337,
        reraNumber: 'PRM/KA/RERA/1251/308/PR/290624/006936',
        possessionTime: 'December 2026',
        units: '875 residential plots',
        landParcel: '73-acre'
    })),

    // 2. Purva Tranquillity
    ...[
        { dim: '1,200', price: 85, unit: 'Lakhs' },
        { dim: '1,500', price: 1.05, unit: 'Cr' },
        { dim: '1,800', price: 1.17, unit: 'Cr' },
        { dim: '2,000', price: 1.30, unit: 'Cr' },
        { dim: '2,400', price: 1.68, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Purva Tranquillity - ${d.dim} sq.ft.`,
        projectName: 'Purva Tranquillity',
        description: 'Purva Tranquillity is a nature-themed, 71-acre gated community on Sarjapur-Attibele Road.',
        category: 'Plot',
        location: 'Sarjapur-Attibele Road, East Bangalore.',
        price: d.price,
        priceUnit: d.unit,
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.832308,
        longitude: 77.794154,
        reraNumber: 'PR/180324/007969',
        possessionTime: 'December 2025',
        units: '800 residential plots',
        landParcel: '71-acre'
    })),

    // 3. KNS Candrill
    ...[
        { dim: '1,200', price: 57.59 },
        { dim: '1,350', price: 64.46 },
        { dim: '1,500', price: 71.33 },
        { dim: '2,400', price: 1.14, unit: 'Cr' }
    ].map(d => ({
        propertyName: `KNS Candrill - ${d.dim} sq.ft.`,
        projectName: 'KNS Candrill',
        description: 'KNS Candrill is a premium RERA-approved gated community on Doddaballapur Main Road.',
        category: 'Plot',
        location: 'Doddaballapur Main Road, North Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.344134,
        longitude: 77.529208,
        reraNumber: 'PRM/KA/RERA/1250/301/PR/050924/007000',
        possessionTime: 'June 15, 2029',
        units: '452 units',
        landParcel: '28 acres'
    })),

    // 4. Century Artizan
    ...[
        { dim: '2,400', price: 1.77 },
        { dim: '3,750', price: 2.43 },
        { dim: '4,000', price: 2.80 },
        { dim: '4,800', price: 6.10 },
        { dim: '4,900 – 6,922', price: 6.75 }
    ].map(d => ({
        propertyName: `Century Artizan - ${d.dim} sq.ft.`,
        projectName: 'Century Artizan',
        description: 'Century Artizan is a premium art-themed gated community of luxury villa plots in Yelahanka.',
        category: 'Plot',
        location: 'Yelahanka, North Bengaluru.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.129342,
        longitude: 77.595166,
        reraNumber: 'PRM/KA/RERA/1251/309/PR/171123/000881',
        possessionTime: 'Ready for Registration',
        units: '246 residential units',
        landParcel: '48 acres'
    })),

    // 5. Sattva Bhumi
    ...[
        { dim: '600', price: 37.91 },
        { dim: '1,200', price: 72.97 },
        { dim: '1,500', price: 90.53 },
        { dim: '1,800', price: 1.08, unit: 'Cr' },
        { dim: '~1,726', price: 1.03, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Sattva Bhumi - ${d.dim} sq.ft.`,
        projectName: 'Sattva Bhumi',
        description: 'Sattva Bhumi is a premium 20-acre gated community by the Sattva Group in Devanahalli.',
        category: 'Plot',
        location: 'Devanahalli, North Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.288844,
        longitude: 77.776053,
        reraNumber: 'PRM/KA/RERA/1250/303/PR/211024/007160',
        possessionTime: 'December 2026',
        units: '356 units',
        landParcel: '20 acres'
    })),

    // 6. Prestige Crystal Lawns
    ...[
        { dim: '1,500', price: 1.35 },
        { dim: '1,800', price: 1.66 },
        { dim: '2,400', price: 2.10 },
        { dim: '3,000', price: 2.70 },
        { dim: '3,200', price: 3.14 },
        { dim: '3,600', price: 3.20 },
        { dim: '4,000', price: 3.24 }
    ].map(d => ({
        propertyName: `Prestige Crystal Lawns - ${d.dim} sq.ft.`,
        projectName: 'Prestige Crystal Lawns',
        description: 'Prestige Crystal Lawns is a premium 24-acre gated community of residential plots on IVC Road.',
        category: 'Plot',
        location: 'Devanahalli, North Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.230026,
        longitude: 77.620347,
        reraNumber: 'PRM/KA/RERA/1250/303/PR/300925/008132',
        possessionTime: 'March 2027',
        units: '235 premium plots',
        landParcel: '25 acres'
    })),

    // 7. Provident Tivoli Hills
    ...[
        { dim: '~1,200', price: 61 },
        { dim: '~1,500', price: 75 },
        { dim: '~2,400', price: 1.18, unit: 'Cr' },
        { dim: '~3,200', price: 1.56, unit: 'Cr' },
        { dim: 'Up to 20,699', price: 13.8, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Provident Tivoli Hills - ${d.dim} sq.ft.`,
        projectName: 'Provident Tivoli Hills',
        description: 'Provident Tivoli Hills is a premium Italian-themed gated plotted development in Devanahalli.',
        category: 'Plot',
        location: 'Devanahalli, North Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.258453,
        longitude: 77.709041,
        reraNumber: 'PRM/KA/RERA/1251/309/PR/211008/004359',
        possessionTime: 'June 2026',
        units: '839 residential plots',
        landParcel: '61-acre'
    })),

    // 8. TATA Raagam
    ...[
        { dim: '1,200', price: 85 },
        { dim: '1,500', price: 1.1, unit: 'Cr' },
        { dim: '1,800', price: 1.4, unit: 'Cr' },
        { dim: '2,400', price: 1.8, unit: 'Cr' },
        { dim: 'Up to 3,500+', price: 4, unit: 'Cr' }
    ].map(d => ({
        propertyName: `TATA Raagam - ${d.dim} sq.ft.`,
        projectName: 'TATA Raagam',
        description: 'TATA Raagam is a premium music-themed residential plotted development within the Tata Carnatica township.',
        category: 'Plot',
        location: 'Shettigere, Devanahalli, North Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.193981,
        longitude: 77.670123,
        reraNumber: 'PRM/KA/RERA/1250/303/PR/180924/007032',
        possessionTime: 'June 2028',
        units: '576 units',
        landParcel: '42 acres'
    })),

    // 9. Prestige Marigold Phase 2
    ...[
        { dim: '860', price: 0.70 },
        { dim: '1,200', price: 1.02 },
        { dim: '1,500', price: 1.27 },
        { dim: '2,400', price: 2.04 },
        { dim: '4,000', price: 3.20 },
        { dim: '6,225', price: 5.51 }
    ].map(d => ({
        propertyName: `Prestige Marigold Phase 2 - ${d.dim} sq.ft.`,
        projectName: 'Prestige Marigold Phase 2',
        description: 'Prestige Marigold Phase 2 is a premium 50-acre gated community in North Bangalore near Airport.',
        category: 'Plot',
        location: 'Bettenahalli, North Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.200021,
        longitude: 77.581970,
        reraNumber: 'PRM/KA/RERA/1250/303/PR/171225/008346',
        possessionTime: '30 November 2027',
        units: '716 premium plots',
        landParcel: '55 acres'
    })),

    // 10. Tangled Up In Green
    ...[
        { dim: '1,800', price: 1.34 },
        { dim: '2,100', price: 1.57 },
        { dim: '2,400', price: 1.80 },
        { dim: '2,700', price: 2.02 },
        { dim: '3,200', price: 2.40 },
        { dim: '3,600', price: 2.70 },
        { dim: '5,000', price: 3.74 },
        { dim: '7,200', price: 5.85 }
    ].map(d => ({
        propertyName: `Tangled Up In Green - ${d.dim} sq.ft.`,
        projectName: 'Tangled Up In Green',
        description: 'Tangled Up In Green is a premium 110-acre eco-conscious plotted development in Devanahalli.',
        category: 'Plot',
        location: 'Devanahalli, Bangalore.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.264166,
        longitude: 77.682450,
        reraNumber: 'PRM/KA/RERA/1250/303/PR/080124/006538',
        possessionTime: 'December 2028',
        units: '968 residential plots',
        landParcel: '115 acres'
    })),

    // 11. Prestige Great Acres
    ...[
        { dim: '1,200', price: 1.82 },
        { dim: '1,500', price: 2.34 },
        { dim: '1,800', price: 2.81 },
        { dim: '2,400', price: 3.75 },
        { dim: '4,000', price: 6.05 }
    ].map(d => ({
        propertyName: `Prestige Great Acres - ${d.dim} sq.ft.`,
        projectName: 'Prestige Great Acres',
        description: 'Prestige Great Acres is an 80-acre premium gated community within the massive Prestige City township.',
        category: 'Plot',
        location: 'Sarjapur-Marathahalli Road, Bangalore',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.877126,
        longitude: 77.783243,
        reraNumber: 'PRM/KA/RERA/1251/308/PR/210824/004289',
        possessionTime: 'Ready-to-move-in',
        units: '808 residential plots',
        landParcel: '80-acre'
    })),

    // 12. Reliable Downtown
    ...[
        { dim: '746', price: 89.49, unit: 'Lakhs' },
        { dim: '878', price: 1.05, unit: 'Cr' },
        { dim: '940', price: 1.13, unit: 'Cr' },
        { dim: '1040', price: 1.25, unit: 'Cr' },
        { dim: '1200', price: 1.44, unit: 'Cr' },
        { dim: '1500', price: 1.80, unit: 'Cr' },
        { dim: '1631', price: 1.96, unit: 'Cr' },
        { dim: '1800', price: 2.16, unit: 'Cr' },
        { dim: '1999', price: 2.40, unit: 'Cr' },
        { dim: '2373', price: 2.85, unit: 'Cr' },
        { dim: '2609', price: 3.13, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Reliaable Downtown - ${d.dim} sq.ft.`,
        projectName: 'Reliaable Downtown',
        description: 'Reliaable The Downntown is a massive RERA-approved luxury plotted development in Rayasandra.',
        category: 'Plot',
        location: 'Rayasandra area, South Bangalore.',
        price: d.price,
        priceUnit: d.unit,
        dimensions: d.dim,
        status: 'Available',
        latitude: 12.866811,
        longitude: 77.680177,
        reraNumber: 'PRM/KA/RERA/1251/310/PR/160524/006877',
        possessionTime: 'April 2029',
        units: '168 units',
        landParcel: '40-acre'
    })),

    // 13. The District by Navilu
    ...[
        { dim: '1,200', price: 54.0 },
        { dim: '1,500', price: 67.5 },
        { dim: '2,000', price: 90.0 }
    ].map(d => ({
        propertyName: `The District - ${d.dim} sq.ft.`,
        projectName: 'The District by Navilu',
        description: 'The District by Navilu is a 14.5-acre tropical-themed gated community in South Bangalore.',
        category: 'Plot',
        location: 'Jigani Hobli, Anekal Taluk, Bangalore.',
        price: d.price,
        priceUnit: 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.184398,
        longitude: 77.544641,
        reraNumber: 'PRM/KA/RERA/1251/308/PR/250825/008029',
        possessionTime: 'November 30, 2026',
        units: '226 residential villa plots',
        landParcel: '3 acres'
    })),

    // 14. CODE NAME DOUBLE UP
    ...[
        { dim: '1,200', price: 55 },
        { dim: '1,500', price: 70 },
        { dim: '2,400', price: 1.1, unit: 'Cr' },
        { dim: '4,000', price: 1.8, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Codename Double Up - ${d.dim} sq.ft.`,
        projectName: 'CODE NAME DOUBLE UP',
        description: 'Aevora Codename Double Up is a 30-acre premium plotted development in Doddaballapur.',
        category: 'Plot',
        location: 'Doddaballapur, North Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 13.320856,
        longitude: 77.552066,
        reraNumber: 'NA',
        possessionTime: 'September 2028',
        units: '267 units',
        landParcel: '30-acre'
    })),

    // 15. One Goa (New)
    ...[
        { dim: '1,248', price: 78.00 },
        { dim: '1,539', price: 99.00 },
        { dim: '1,851', price: 1.17, unit: 'Cr' },
        { dim: '2,000', price: 1.18, unit: 'Cr' },
        { dim: '2,400+', price: 1.35, unit: 'Cr' }
    ].map(d => ({
        propertyName: `One Goa - ${d.dim} sq.ft.`,
        projectName: 'One Goa',
        description: 'One Goa is a 130-acre carbon-negative luxury development by The House of Abhinandan Lodha in Bicholim.',
        category: 'Plot',
        location: 'Bicholim, North Goa.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        latitude: 15.571771,
        longitude: 73.975531,
        reraNumber: 'PRGO03252427',
        possessionTime: 'March 2029',
        units: '1,383 units',
        landParcel: '130+ acres'
    })),

    // 16. Sumadhura Panorama
    ...[
        { dim: '1,200', price: 80 },
        { dim: '1,500', price: 1.0, unit: 'Cr' },
        { dim: '2,000', price: 1.3, unit: 'Cr' },
        { dim: '2,400', price: 1.6, unit: 'Cr' }
    ].map(d => ({
        propertyName: `Sumadhura Panorama - ${d.dim} sq.ft.`,
        projectName: 'Sumadhura Panorama',
        description: 'Devanahalli, North Bangalore.',
        category: 'Plot',
        location: 'Devanahalli, North Bangalore.',
        price: d.price,
        priceUnit: d.unit || 'Lakhs',
        dimensions: d.dim,
        status: 'Available',
        possessionTime: 'December 2027'
    })),

    // 17. Sammys Beverly Hills
    ...[
        { dim: '1,163 - 1,200', price: 1.64 },
        { dim: '2,000', price: 2.8 },
        { dim: '2,400', price: 3.3 },
        { dim: '3,000', price: 4.2 },
        { dim: '3,600', price: 5.0 },
        { dim: '3,200', price: 4.5 },
        { dim: '4,000', price: 5.6 },
        { dim: '4,800', price: 6.7 }
    ].map((d, i) => ({
        propertyName: `Sammys Beverly Hills - ${d.dim} sq.ft.`,
        projectName: 'Sammys Beverly Hills',
        description: 'Sammys Dreamland, Bellary Road, Bengaluru.',
        category: 'Plot',
        location: 'Bellary Road, Bengaluru.',
        price: d.price,
        priceUnit: 'Cr',
        dimensions: d.dim,
        status: 'Available',
        possessionTime: 'June 2025'
    })),
];

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        console.log('Database path:', sequelize.options.storage);

        // Sync to ensure table exists
        await sequelize.sync();

        for (const plot of plots) {
            await Property.create(plot);
            console.log(`Created: ${plot.propertyName}`);
        }

        console.log(`Seeding completed. Total plots added: ${plots.length}`);
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
