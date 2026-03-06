const fs = require('fs');
const path = require('path');
const { Property, Interaction, Inquiry, Favorite } = require('./src/models');
const sequelize = require('./src/config/database');

async function syncData() {
    try {
        console.log('🔄 Reading live data from local JSON file...');
        const rawData = fs.readFileSync(path.join(__dirname, 'live_properties_full.json'), 'utf8');
        const data = JSON.parse(rawData);
        const liveProperties = data.properties;

        if (!liveProperties || liveProperties.length === 0) {
            console.log('❌ No properties found on live server.');
            return;
        }

        console.log(`✅ Found ${liveProperties.length} properties.`);

        // Sync database schema
        await sequelize.sync();

        console.log('🗑️ Clearing local database records...');
        // Clear dependent tables first to avoid FK constraints
        await Interaction.destroy({ where: {}, truncate: false });
        await Inquiry.destroy({ where: {}, truncate: false });
        await Favorite.destroy({ where: {}, truncate: false });
        await Property.destroy({ where: {}, truncate: false });

        // Insert live properties
        console.log('📥 Injecting live properties...');
        for (const prop of liveProperties) {
            await Property.create({
                id: prop.id,
                propertyName: prop.propertyName,
                description: prop.description,
                category: prop.category,
                location: prop.location,
                price: prop.price,
                priceUnit: prop.priceUnit,
                dimensions: prop.dimensions,
                configuration: prop.configuration,
                photos: prop.photos,
                projectName: prop.projectName,
                amenities: prop.amenities,
                status: prop.status,
                // Better coordinate assignment based on location keywords
                latitude: prop.latitude || (() => {
                    const loc = (prop.location || '').toLowerCase();
                    if (loc.includes('electronic city')) return 12.84 + (Math.random() - 0.5) * 0.02;
                    if (loc.includes('yelahanka')) return 13.10 + (Math.random() - 0.5) * 0.02;
                    if (loc.includes('whitefield')) return 12.96 + (Math.random() - 0.5) * 0.02;
                    if (loc.includes('goa')) return 15.59 + (Math.random() - 0.5) * 0.02;
                    return 12.97 + (Math.random() - 0.5) * 0.1; // Default Bangalore center
                })(),
                longitude: prop.longitude || (() => {
                    const loc = (prop.location || '').toLowerCase();
                    if (loc.includes('electronic city')) return 77.67 + (Math.random() - 0.5) * 0.02;
                    if (loc.includes('yelahanka')) return 77.59 + (Math.random() - 0.5) * 0.02;
                    if (loc.includes('whitefield')) return 77.75 + (Math.random() - 0.5) * 0.02;
                    if (loc.includes('goa')) return 73.95 + (Math.random() - 0.5) * 0.02;
                    return 77.59 + (Math.random() - 0.5) * 0.1; // Default Bangalore center
                })(),
                createdAt: prop.createdAt,
                updatedAt: prop.updatedAt
            });
        }

        console.log('✨ Sync complete! Your local machine now has the live data.');
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    } finally {
        process.exit();
    }
}

syncData();
