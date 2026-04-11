const { Property } = require('./src/models');
const sequelize = require('./src/config/database');

async function enrich() {
    try {
        console.log('--- STARTING LOCATION ENRICHMENT ---');
        const properties = await Property.findAll();
        console.log(`Found ${properties.length} properties to process.`);

        let count = 0;
        for (const prop of properties) {
            const loc = (prop.location || '').toLowerCase();
            let city = '';
            let country = '';

            // Country Detection logic
            if (loc.includes('uae') || loc.includes('dubai') || loc.includes('abu dhabi')) {
                country = 'UAE';
            } else {
                // Default to India if not obviously middle east (as per project context)
                country = 'India';
            }

            // City Detection logic
            if (loc.includes('dubai')) city = 'Dubai';
            else if (loc.includes('abu dhabi')) city = 'Abu Dhabi';
            else if (loc.includes('sharjah')) city = 'Sharjah';
            else if (loc.includes('bangalore') || loc.includes('bengaluru')) city = 'Bangalore';
            else if (loc.includes('goa')) city = 'Goa';
            else if (loc.includes('mumbai')) city = 'Mumbai';
            else if (loc.includes('pune')) city = 'Pune';
            else if (loc.includes('hyderabad')) city = 'Hyderabad';
            else if (loc.includes('delhi') || loc.includes('noida') || loc.includes('gurgaon')) city = 'NCR';
            else {
                // Fallback: take the last part of the comma separated string if it looks like a city
                const parts = prop.location.split(',').map(s => s.trim());
                if (parts.length > 1) {
                    city = parts[parts.length - 1];
                    if (city.toLowerCase() === 'india' || city.toLowerCase() === 'uae') {
                        city = parts[parts.length - 2] || 'Other';
                    }
                } else {
                    city = 'Other';
                }
            }

            await prop.update({ city, country });
            count++;
            if (count % 50 === 0) console.log(`Processed ${count} properties...`);
        }

        console.log(`--- SUCCESS: Enriched ${count} properties with City/Country data ---`);
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

enrich();
