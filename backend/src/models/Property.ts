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
        type: DataTypes.ENUM('Villa', 'Plot', 'Farm Land', 'Commercial', 'Residential', 'Resale', 'Rental'),
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
    brochure: {
        type: DataTypes.JSON,
        defaultValue: [],
    },
    floorPlan: {
        type: DataTypes.JSON,
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
    latitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    longitude: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    reraNumber: {
        type: DataTypes.STRING,
    },
    builderInfo: {
        type: DataTypes.STRING,
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    projectHighlights: {
        type: DataTypes.JSON,
        defaultValue: [],
    },
    possessionStatus: {
        type: DataTypes.ENUM('Ready to Move', 'Under Construction', 'Pre Launch'),
        defaultValue: 'Ready to Move',
    },
    furnishingStatus: {
        type: DataTypes.ENUM('Unfurnished', 'Semi-Furnished', 'Fully Furnished'),
        defaultValue: 'Unfurnished',
    },
    bhk: {
        type: DataTypes.INTEGER,
    },
    possessionTime: {
        type: DataTypes.STRING,
    },
    developerName: {
        type: DataTypes.STRING,
    },
    landParcel: {
        type: DataTypes.STRING,
    },
    floor: {
        type: DataTypes.STRING,
    },
    units: {
        type: DataTypes.STRING,
    },
    investmentType: {
        type: DataTypes.STRING,
    },
}, {
    timestamps: true,
});

module.exports = Property;
