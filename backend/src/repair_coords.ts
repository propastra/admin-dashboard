const path = require('path');
const { Property, sequelize } = require('./models');
const { Op } = require('sequelize');

async function repair() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        
        // Find properties where latitude > 40 (Clearly swapped if in India/UAE)
        const swapped = await Property.findAll({
            where: {
                latitude: { [Op.gt]: 40 }
            }
        });

        console.log(`Found ${swapped.length} properties with swapped coordinates.`);

        for (const prop of swapped) {
            const oldLat = prop.latitude;
            const oldLng = prop.longitude;

            console.log(`Repairing "${prop.propertyName}": Swapping [${oldLat}, ${oldLng}] -> [${oldLng}, ${oldLat}]`);
            
            await prop.update({
                latitude: oldLng,
                longitude: oldLat
            });
        }

        console.log('\n--- Repair Complete ---');
        process.exit(0);
    } catch (err) {
        console.error('Repair failed:', err);
        process.exit(1);
    }
}

repair();
