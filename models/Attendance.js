const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true 
    },
    name: { type: String, required: true },
    employeeId: { type: String, required: true },
    status: { type: String, default: 'Clocked In' },
    location: { type: String, default: 'Main Lobby' }, // Added for Live Map
    date: { type: String }, // Added for Chart grouping
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);