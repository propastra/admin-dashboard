const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Interaction = sequelize.define('Interaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    interactionType: {
        type: DataTypes.ENUM('View', 'Click', 'Inquiry', 'Search'),
        allowNull: false,
    },
    metadata: {
        type: DataTypes.JSON, // Stores extra details if needed
    },
}, {
    timestamps: true,
});

module.exports = Interaction;
