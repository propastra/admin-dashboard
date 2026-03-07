const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inquiry = sequelize.define('Inquiry', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
    },
    status: {
        type: DataTypes.ENUM('New', 'Contacted', 'Visit Scheduled', 'Closed'),
        defaultValue: 'New',
    },
    assignedTo: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        }
    },
    visitDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    followUpDate: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    timestamps: true,
});

module.exports = Inquiry;
