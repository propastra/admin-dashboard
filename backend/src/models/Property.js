const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Property = sequelize.define('Property', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    propertyName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    category: {
        type: DataTypes.ENUM('Villa', 'Plot', 'Farm Land', 'Commercial', 'Residential', 'Resale', 'Retail'),
        allowNull: false,
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
    },
    priceUnit: {
        type: DataTypes.ENUM('Cr', 'Lakhs', 'Thousands'),
        defaultValue: 'Lakhs',
    },
    dimensions: {
        type: DataTypes.STRING, // e.g., "1200 sqft"
    },
    configuration: {
        type: DataTypes.STRING, // e.g., "3BHK"
    },
    photos: {
        type: DataTypes.JSON, // SQLite stores JSON as TEXT
        defaultValue: [],
    },
    projectName: {
        type: DataTypes.STRING,
    },
    amenities: {
        type: DataTypes.JSON,
        defaultValue: [],
    },
    status: {
        type: DataTypes.ENUM('Available', 'Sold', 'Pending', 'EOI', 'RTMI'),
        defaultValue: 'Available',
    },
}, {
    timestamps: true,
});

module.exports = Property;
