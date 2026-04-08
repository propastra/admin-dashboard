const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

async function identify() {
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
            latitude: DataTypes.FLOAT,
            longitude: DataTypes.FLOAT
        }, { tableName: 'Properties', timestamps: false });

        const isInOcean = (lat, lon) => {
            if (!lat || !lon) return false;
            // West Coast (Arabian Sea)
            if (lat < 16.0 && lon < 73.5) return true;
            if (lat < 14.5 && lon < 74.5) return true;
            if (lat < 12.5 && lon < 74.8) return true;
            if (lat < 10.0 && lon < 76.0) return true;
            // East Coast (Bay of Bengal)
            if (lat < 16.0 && lon > 81.5) return true;
            if (lat < 13.0 && lon > 80.5) return true;
            return false;
        };

        const oceanProps = await Property.findAll({
            where: {
                latitude: { [Sequelize.Op.ne]: null },
                longitude: { [Sequelize.Op.ne]: null }
            }
        });

        const filtered = oceanProps.filter(p => isInOcean(p.latitude, p.longitude));

        console.log(`Found ${filtered.length} properties in the ocean:`);
        filtered.forEach(p => {
            console.log(`- ID: ${p.id} | Name: ${p.propertyName} | Location: ${p.location} | Lat: ${p.latitude} | Lon: ${p.longitude}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

identify();
