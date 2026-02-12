const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getEuclideanDistance = (arr1, arr2) => {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return 1.0;
    return Math.sqrt(
        arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
    );
};

// 1. Changed to 'const'
const registerUser = async (req, res) => {
    try {
        const { name, employeeId, email, password, faceDescriptor } = req.body;
        if (!name || !employeeId || !faceDescriptor) {
            return res.status(400).json({ message: "Missing required fields." });
        }
        const existingId = await User.findOne({ employeeId });
        if (existingId) return res.status(400).json({ message: "Employee ID already exists." });

        let hashedPassword = "";
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        const newUser = new User({
            name, employeeId,
            email: email || `${employeeId}@company.com`,
            password: hashedPassword,
            faceDescriptor
        });

        await newUser.save();
        res.status(201).json({ success: true, message: "User registered successfully" });
    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `The ${field} is already in use.` });
        }
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// 2. Changed to 'const'
const verifyFace = async (req, res) => {
    try {
        const { capturedDescriptor } = req.body;
        if (!capturedDescriptor) return res.status(400).json({ success: false, message: "No face detected." });

        const users = await User.find({ faceDescriptor: { $exists: true, $ne: [] } });
        let bestMatch = null;
        let minDistance = 0.55; 

        users.forEach((user) => {
            const distance = getEuclideanDistance(capturedDescriptor, user.faceDescriptor);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user;
            }
        });

        if (bestMatch) {
            return res.json({ success: true, user: { name: bestMatch.name, employeeId: bestMatch.employeeId } });
        }
        return res.status(401).json({ success: false, message: "Face not recognized." });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server error." });
    }
};

// 3. Changed to 'const'
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.role !== 'admin') return res.status(401).json({ message: "Unauthorized." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user: { name: user.name, role: user.role } });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

// Now this block will work perfectly!
module.exports = {
    registerUser,
    verifyFace,
    loginAdmin
};