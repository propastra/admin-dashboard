const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interaction = sequelize.define('Interaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    interactionType: {
        type: DataTypes.ENUM('View', 'Click', 'Inquiry', 'Search', 'Comparison'),
        allowNull: false,
    },
    websiteUserId: {
        type: DataTypes.UUID,
        allowNull: true, // Optional for guest users
    },
    metadata: {
        type: DataTypes.JSON, // Stores extra details if needed
    },
}, {
    timestamps: true,
});

module.exports = Interaction;
