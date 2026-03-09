const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

async function debug() {
    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '..', 'database.sqlite'),
        logging: false
    });

    try {
        const Property = sequelize.define('Property', {
            id: { type: DataTypes.UUID, primaryKey: true },
            propertyName: DataTypes.STRING,
            location: DataTypes.STRING,
            category: DataTypes.STRING,
            projectName: DataTypes.STRING,
            photos: DataTypes.JSON
        }, { tableName: 'Properties', timestamps: false });

        const listLocations = async () => {
            try {
                const locations = await Property.findAll({
                    attributes: ['location'],
                    group: ['location']
                });
                console.log('Distinct Locations in DB:');
                locations.forEach(l => console.log(`- ${l.location}`));
            } catch (err) {
                console.error('Error listing locations:', err);
            }
        };

        await listLocations(); // Call the new function
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

debug();
