const express = require('express');
const router = express.Router();
const { markAttendance, getUserStats, getUserWeeklyStats } = require('../controllers/attendanceController');
const Attendance = require('../models/Attendance');
const { protect } = require('../middleware/authMiddleware');
const attendanceController = require('../controllers/attendanceController');


// Mark Attendance (Public)
router.post('/mark', markAttendance);

// Get specific user stats (Public/Protected depending on preference)
router.get('/users-list', attendanceController.getAllUsers);
router.put('/user/:id', attendanceController.updateUser);
router.get('/stats/:userId', getUserStats);
router.get('/weekly-stats/:userId', getUserWeeklyStats);

// Get all attendance for Admin (Protected)
router.get('/all', protect, async (req, res) => {
    try {
        const records = await Attendance.find()
            .populate('userId', 'name employeeId')
            .sort({ createdAt: -1 });
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: "Error fetching records" });
    }
});


module.exports = router;