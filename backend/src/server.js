const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/inquiries', require('./routes/inquiries'));

// Test API
app.get('/', (req, res) => {
    res.send('Real Estate Admin Dashboard API is running');
});

// Sync Database and Start Server
sequelize.sync({ alter: true })
    .then(() => {
        console.log('Database synced');
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to sync database:', err);
    });
