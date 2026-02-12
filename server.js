const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 1. Request Logging Middleware (Great for Render logs)
app.use((req, res, next) => {
    console.log(`${req.method} request made to: ${req.url}`);
    next();
});

// 2. Optimized CORS (Crucial for connecting Frontend to Backend)
app.use(cors({
    origin: [
        "http://localhost:5173", // For your local development
        "https://your-frontend-name.vercel.app" // Add your future Vercel URL here
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

// 3. Payload Limits (Required for handling large Face Descriptors)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. Health Check Route (Used by your Frontend's isOnline check)
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

// 7. Render-Friendly Port Binding
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});