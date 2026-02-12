const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Request Logging Middleware
app.use((req, res, next) => {
    console.log(`${req.method} request made to: ${req.url}`);
    next();
});

// 2. Optimized CORS (Updated with your actual Vercel URLs)
const allowedOrigins = [
    "http://localhost:5173",
    "https://facial-recognition-attendance-syste-one.vercel.app", // Your specific alias
    "https://facial-recognition-attendance-system-odq8rdhjr.vercel.app" // Your production deployment
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Added OPTIONS
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"] // Explicitly allow these
}));

// 3. Payload Limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'online', timestamp: new Date() });
});

// 5. Routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// 6. DB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// Port configuration for Render
const PORT = process.env.PORT || 10000; 

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
