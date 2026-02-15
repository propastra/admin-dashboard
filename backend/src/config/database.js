const { Sequelize } = require('sequelize');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
    process.env.DB_NAME || 'real_estate_db',
    process.env.DB_USER || 'admin',
    process.env.DB_PASS || 'password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'sqlite',
        storage: './database.sqlite', // Use SQLite file storage
        logging: false,
    }
);

module.exports = sequelize;
