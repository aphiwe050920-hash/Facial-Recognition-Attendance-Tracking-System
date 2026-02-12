const express = require('express');
const router = express.Router();

// Ensure 'loginAdmin' is included in this curly bracket destructuring
const { registerUser, verifyFace, loginAdmin } = require('../controllers/authController');

/**
 * @route   GET /api/auth/test
 * @desc    Test route to verify API connectivity
 */
router.get('/test', (req, res) => {
    res.json({ 
        success: true, 
        message: "Auth API is live and responding! 🚀",
        timestamp: new Date()
    });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new employee with face descriptors
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify face for attendance marking
 */
router.post('/verify', verifyFace);

/**
 * @route   POST /api/auth/login
 * @desc    Admin login
 */
router.post('/login', loginAdmin);

module.exports = router;