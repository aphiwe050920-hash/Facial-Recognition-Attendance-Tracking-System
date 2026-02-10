const express = require('express');
const router = express.Router();

// Ensure 'loginAdmin' is included in this curly bracket destructuring
const { registerUser, verifyFace, loginAdmin } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify', verifyFace);
router.post('/login', loginAdmin); // This line will work now!

module.exports = router;