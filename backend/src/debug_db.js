const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

async function debug() {
    const dbPath = path.join(__dirname, 'database.sqlite');
    console.log(`Target DB: ${dbPath}`);
    console.log(`Exists: ${fs.existsSync(dbPath)}`);

    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: console.log
    });

    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('Tables found:', results);

        const Property = sequelize.define('Property', {
            id: { type: DataTypes.UUID, primaryKey: true },
            propertyName: DataTypes.STRING
        }, { 
            tableName: 'Properties',
            freezeTableName: true,
            timestamps: true 
        });

        const count = await Property.count();
        console.log(`Total properties in target: ${count}`);

    } catch (e) {
        console.error('Debug failed:', e);
    } finally {
        await sequelize.close();
    }
}

debug();
