const Attendance = require('../models/Attendance');
const User = require('../models/User');

const getEuclideanDistance = (arr1, arr2) => {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return 1.0;
    return Math.sqrt(arr1.reduce((sum, val, i) => sum + Math.pow(val - arr2[i], 2), 0));
};

// 1. MAIN ATTENDANCE LOGIC (The "Face Punch")
exports.markAttendance = async (req, res) => {
    try {
        const { capturedDescriptor, location } = req.body;
        if (!capturedDescriptor) return res.status(400).json({ message: "No face data received." });

        const users = await User.find({ faceDescriptor: { $exists: true, $ne: [] } });
        let matchedUser = null;
        let minDistance = 0.55; 

        users.forEach(user => {
            const distance = getEuclideanDistance(capturedDescriptor, user.faceDescriptor);
            if (distance < minDistance) {
                minDistance = distance;
                matchedUser = user;
            }
        });

        if (!matchedUser) return res.status(401).json({ message: "Face not recognized." });

        // Cooldown Check (2 minutes to prevent double-logging)
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const recentRecord = await Attendance.findOne({
            userId: matchedUser._id,
            createdAt: { $gte: twoMinutesAgo }
        });
        if (recentRecord) return res.status(429).json({ message: "Cooldown active. Please wait." });

        // Determine Status (Toggle between Clock In and Clock Out)
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const lastRecord = await Attendance.findOne({
            userId: matchedUser._id,
            createdAt: { $gte: todayStart }
        }).sort({ createdAt: -1 });

        const status = (lastRecord && lastRecord.status === 'Clocked In') ? 'Clocked Out' : 'Clocked In';

        // Lateness Logic (Uses Grace Period from User Profile)
        let isLate = false;
        if (status === 'Clocked In') {
            const now = new Date();
            const [sHour, sMinute] = (matchedUser.shiftStart || "09:00").split(':');
            const grace = matchedUser.gracePeriod || 0;

            const shiftTime = new Date();
            shiftTime.setHours(parseInt(sHour), parseInt(sMinute), 0);

            if (now > new Date(shiftTime.getTime() + grace * 60000)) {
                isLate = true;
            }
        }

        const newRecord = new Attendance({
            userId: matchedUser._id,
            name: matchedUser.name,
            employeeId: matchedUser.employeeId,
            status: status,
            isLate: isLate,
            location: location || "Main Lobby",
            date: new Date().toISOString().split('T')[0]
        });

        await newRecord.save();

        res.status(200).json({ 
            success: true, 
            user: { id: matchedUser._id, name: matchedUser.name, status, isLate }
        });

    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

// 2. ADMIN: FETCH ALL LOGS (Required for AdminDashboard.jsx)
exports.getAllAttendance = async (req, res) => {
    try {
        const logs = await Attendance.find().sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching logs" });
    }
};

// 3. USER MANAGEMENT (Required for UserManagement.jsx)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-faceDescriptor');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: "Update failed" });
    }
};

// 4. STATS LOGIC (Required for Charts/Dashboards)
exports.getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const today = new Date().setHours(0, 0, 0, 0);
        const logs = await Attendance.find({ userId, createdAt: { $gte: today } }).sort('createdAt');

        let totalMs = 0;
        for (let i = 0; i < logs.length; i += 2) {
            if (logs[i] && logs[i+1]) {
                totalMs += new Date(logs[i+1].createdAt) - new Date(logs[i].createdAt);
            } else if (logs[i]?.status === 'Clocked In') {
                totalMs += new Date() - new Date(logs[i].createdAt);
            }
        }

        const hours = (totalMs / (1000 * 60 * 60)).toFixed(2);
        res.json({ workingHours: hours });
    } catch (error) {
        res.status(500).json({ message: "Error calculating stats" });
    }
};

exports.getUserWeeklyStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const logs = await Attendance.find({ userId, createdAt: { $gte: sevenDaysAgo } }).sort('createdAt');
        const dailyData = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dailyData[date.toISOString().split('T')[0]] = 0;
        }

        for (let i = 0; i < logs.length; i++) {
            if (logs[i].status === 'Clocked In' && logs[i+1]?.status === 'Clocked Out') {
                const dateKey = logs[i].createdAt.toISOString().split('T')[0];
                const duration = (new Date(logs[i+1].createdAt) - new Date(logs[i].createdAt)) / 3600000;
                if (dailyData[dateKey] !== undefined) dailyData[dateKey] += duration;
                i++;
            }
        }

        const formattedData = Object.keys(dailyData).sort().map(date => ({
            day: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
            hours: dailyData[date].toFixed(2)
        }));

        res.json(formattedData);
    } catch (error) {
        res.status(500).json({ message: "Error fetching weekly stats" });
    }
};