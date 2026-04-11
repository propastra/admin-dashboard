import { Property } from './src/models';
import sequelize from './src/config/database';

async function enrich() {
    try {
        console.log('--- STARTING LOCATION ENRICHMENT ---');
        await (sequelize as any).authenticate();
        const properties = await (Property as any).findAll();
        console.log(`Found ${properties.length} properties to process.`);

        let count = 0;
        for (const prop of properties) {
            const loc = (prop.location || '').toLowerCase();
            let city = '';
            let country = '';

            // Country Detection logic
            if (loc.includes('uae') || loc.includes('dubai') || loc.includes('abu dhabi')) {
                country = 'UAE';
            } else if (loc.includes('india') || loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('goa')) {
                country = 'India';
            } else {
                // Default to UAE for the new properties seen in screenshot (Dubai/Sharjah)
                // If the user has both, we try to be smart.
                country = 'India'; 
            }

            // City Detection logic
            if (loc.includes('dubai')) city = 'Dubai';
            else if (loc.includes('abu dhabi')) city = 'Abu Dhabi';
            else if (loc.includes('sharjah')) city = 'Sharjah';
            else if (loc.includes('bangalore') || loc.includes('bengaluru')) city = 'Bangalore';
            else if (loc.includes('goa')) city = 'Goa';
            else {
                const parts = prop.location.split(',').map((s: string) => s.trim());
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
    } catch (err: any) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit();
    }
}

enrich();
