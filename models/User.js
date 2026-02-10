const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  employeeId: { type: String, required: true, unique: true },
  email: { type: String, unique: true },
  password: { type: String },
  faceDescriptor: { type: [Number], required: true }, 
  role: { type: String, default: 'employee' },
  // --- NEW FIELDS FOR SHIFT DETECTION ---
  shiftStart: { type: String, default: "09:00" }, // 24-hour format
  gracePeriod: { type: Number, default: 15 }      // Minutes allowed before marked Late
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);