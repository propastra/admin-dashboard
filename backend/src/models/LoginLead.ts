const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginLead = sequelize.define('LoginLead', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    websiteUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'WebsiteUsers',
            key: 'id'
        }
    },
    loginMethod: {
        type: DataTypes.ENUM('Email', 'OTP', 'Social'),
        defaultValue: 'Email',
    },
    ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userAgent: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    timestamps: true,
});

module.exports = LoginLead;
