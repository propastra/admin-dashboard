const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Developer = sequelize.define('Developer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    logo: {
        type: DataTypes.STRING, // URL to logo
    },
    description: {
        type: DataTypes.TEXT,
    },
    website: {
        type: DataTypes.STRING,
    },
    projectsCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
}, {
    timestamps: true,
});

module.exports = Developer;
