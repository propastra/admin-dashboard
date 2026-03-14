const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const logger = require('./config/logger');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info('Created uploads directory');
}

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const app = express();
const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const PORT = process.env.PORT || 5001;

// HTTP request logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174')
    .split(',')
    .map(s => s.trim());

app.use(cors({
    origin: function (origin: any, callback: any) {
        // Allow requests with no origin (e.g. mobile apps, curl)
        if (!origin) return callback(null, true);
        // Allow all *.propastra.com and propastraglobal.com subdomains
        if (/^https?:\/\/([a-z0-9-]+\.)?(propastra\.com|propastraglobal\.com)$/i.test(origin)) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));

const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket: any) => {
    logger.info(`Admin Dashboard socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
        logger.info(`Admin Dashboard socket disconnected: ${socket.id}`);
    });
});

// Attach io to req so routes can emit events
app.use((req: any, res: any, next: any) => {
    req.io = io;
    next();
});

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Admin Dashboard Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/inquiries', require('./routes/inquiries'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/developers', require('./routes/developers'));

// Public Website Routes
app.use('/api/website/auth', require('./routes/websiteAuth'));
app.use('/api/website/properties', require('./routes/websiteProperties'));
app.use('/api/website/favorites', require('./routes/websiteFavorites'));
app.use('/api/website/developers', require('./routes/developers'));

// Test API
app.get('/', (req, res) => {
    res.send('Real Estate Admin Dashboard API is running');
});

// Sync Database and Start Server
sequelize.sync()
    .then(async () => {
        logger.info('Database synced');
        
        // Safely add missing columns to production DB since { alter: true } is disabled
        try {
            await sequelize.query('ALTER TABLE Inquiries ADD COLUMN propertyId CHAR(36);');
            logger.info('Added propertyId to Inquiries');
        } catch (e) {
            // Column already exists
        }
        
        try {
            await sequelize.query('ALTER TABLE Inquiries ADD COLUMN websiteUserId CHAR(36);');
            logger.info('Added websiteUserId to Inquiries');
        } catch (e) {
            // Column already exists
        }
        
        try {
            await sequelize.query('ALTER TABLE Inquiries ADD COLUMN email VARCHAR(255);');
            logger.info('Added email to Inquiries');
        } catch (e) {
            // Column already exists
        }

        try {
            await sequelize.query('ALTER TABLE Properties ADD COLUMN masterPlan TEXT;');
            logger.info('Added masterPlan to Properties');
        } catch (e) {
            // Column already exists
        }

        server.listen(PORT, () => {
            logger.info(`Server is running on port ${PORT}`);
        });
    })
    .catch((err: any) => {
        logger.error('Unable to sync database: %s', err.message);
    });
