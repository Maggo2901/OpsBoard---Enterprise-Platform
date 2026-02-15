const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const apiRoutes = require('./routes/api');
const { startCleanupJob } = require('./jobs/cleanupJob');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logging - detailed in dev, concise in prod
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files for uploads with Content-Disposition
// Serve uploads with strict security headers
app.use('/uploads', (req, res, next) => {
    // Force download to prevent executing HTML/Typescript in browser
    res.setHeader('Content-Disposition', 'attachment');
    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
}, express.static(path.join(__dirname, '../data/uploads')));

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Centralized Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack); // Always log stack to console/logs

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message: message,
        // Only include stack trace in development
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`CORS Origin: ${allowedOrigin}`);
    console.log(`Uploads directory served at /uploads`);
    
    // Start background jobs
    startCleanupJob();
});
