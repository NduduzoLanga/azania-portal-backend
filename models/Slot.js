const mongoose = require('mongoose');

// Blueprint for available scheduling blocks
const slotSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g., "2026-07-06"
  times: [{ 
    type: String, 
    required: true 
  }] // Array of sessions, e.g., ["09:00 AM", "13:00 PM"]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Slot', slotSchema);