const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Visitor = sequelize.define('Visitor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    userAgent: {
        type: DataTypes.STRING,
    },
    isBlocked: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    lastVisit: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    totalDuration: {
        type: DataTypes.INTEGER,
        defaultValue: 0, // In seconds
    },
    lastActive: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    timestamps: true,
});

module.exports = Visitor;
