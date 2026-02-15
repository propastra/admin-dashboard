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
    email: {
        type: DataTypes.STRING,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
    },
    status: {
        type: DataTypes.ENUM('New', 'Contacted', 'Closed'),
        defaultValue: 'New',
    }
}, {
    timestamps: true,
});

module.exports = Inquiry;
