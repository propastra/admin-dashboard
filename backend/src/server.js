const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const path = require('path');
const morgan = require('morgan');
const logger = require('./config/logger');

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const app = express();
const PORT = process.env.PORT || 5001;

// HTTP request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map(s => s.trim());

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl)
        if (!origin) return callback(null, true);
        // Allow all *.propastra.com subdomains
        if (/^https?:\/\/([a-z0-9-]+\.)?propastra\.com$/i.test(origin)) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Admin Dashboard Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/inquiries', require('./routes/inquiries'));

// Public Website Routes
app.use('/api/website/auth', require('./routes/websiteAuth'));
app.use('/api/website/properties', require('./routes/websiteProperties'));
app.use('/api/website/favorites', require('./routes/websiteFavorites'));

// Test API
app.get('/', (req, res) => {
    res.send('Real Estate Admin Dashboard API is running');
});

// Sync Database and Start Server
//sequelize.sync({ alter: true })
sequelize.sync()
    .then(() => {
        logger.info('Database synced');
        app.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        logger.error('Unable to sync database: %s', err.message);
    });
