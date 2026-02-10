const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Helper: Euclidean Distance
 * Calculates how similar two face descriptors are.
 */
const getEuclideanDistance = (arr1, arr2) => {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return 1.0;
    return Math.sqrt(
        arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0)
    );
};

/**
 * Register a new User/Employee
 */
exports.registerUser = async (req, res) => {
    try {
        const { name, employeeId, email, password, faceDescriptor } = req.body;

        // 1. Validation
        if (!name || !employeeId || !faceDescriptor) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // 2. Check for existing Employee ID manually first
        const existingId = await User.findOne({ employeeId });
        if (existingId) return res.status(400).json({ message: "Employee ID already exists." });

        // 3. Hash Password (if provided)
        let hashedPassword = "";
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        // 4. Create User
        const newUser = new User({
            name,
            employeeId,
            email: email || `${employeeId}@company.com`,
            password: hashedPassword,
            faceDescriptor
        });

        // 5. Save with Duplicate Error Catching
        await newUser.save();
        res.status(201).json({ success: true, message: "User registered successfully" });

    } catch (error) {
        // 🔥 THIS CATCHES THE DUP KEY ERROR
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ 
                message: `The ${field} '${error.keyValue[field]}' is already in use. Please use a unique one.` 
            });
        }

        console.error("Registration Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
/**
 * Verify Live Face against Database
 */
exports.verifyFace = async (req, res) => {
    try {
        const { capturedDescriptor } = req.body;

        if (!capturedDescriptor) {
            return res.status(400).json({ success: false, message: "No face detected." });
        }

        // Fetch all users with face descriptors
        const users = await User.find({ faceDescriptor: { $exists: true, $ne: [] } });

        let bestMatch = null;
        let minDistance = 0.55; // Threshold (Lower = stricter)

        users.forEach((user) => {
            const distance = getEuclideanDistance(capturedDescriptor, user.faceDescriptor);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = user;
            }
        });

        if (bestMatch) {
            return res.json({ 
                success: true, 
                user: { name: bestMatch.name, employeeId: bestMatch.employeeId } 
            });
        }

        return res.status(401).json({ success: false, message: "Face not recognized." });

    } catch (error) {
        console.error("VERIFY_CRASH:", error);
        return res.status(500).json({ success: false, message: "Server error during face matching." });
    }
};

/**
 * Admin Login
 */
exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || user.role !== 'admin') {
            return res.status(401).json({ message: "Invalid credentials or unauthorized." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." });
        }

        // Check for JWT_SECRET
        if (!process.env.JWT_SECRET) {
            console.error("FATAL: JWT_SECRET is missing in .env file");
            return res.status(500).json({ message: "Server configuration error." });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        return res.json({ token, user: { name: user.name, role: user.role } });

    } catch (error) {
        console.error("LOGIN_CRASH:", error);
        return res.status(500).json({ error: error.message });
    }
};