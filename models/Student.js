const mongoose = require('mongoose');

// Blueprint for a single booking
const bookingSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  }, // Unique transaction ID, e.g., B-SDG1001-1719782400
  examId: { 
    type: String, 
    required: true 
  },
  examName: { 
    type: String, 
    required: true 
  },
  fee: { 
    type: Number, 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  }, // e.g., "2026-07-06"
  time: { 
    type: String, 
    required: true 
  }, // e.g., "09:00 AM"
  paymentStatus: { 
    type: String, 
    enum: ['Pending', 'Paid', 'Successful'], 
    default: 'Pending' 
  },
  outcome: { 
    type: String, 
    enum: ['Conditionally Accepted', 'Approved', 'Confirmed'], 
    default: 'Conditionally Accepted' 
  }
}, { _id: false }); // Disable default sub-document IDs for cleaner structure

// Blueprint for a missed exam
const missedExamSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  }, // e.g., "P1"
  name: { 
    type: String, 
    required: true 
  }, // e.g., "SDG 11 Paper 1 (Theory)"
  fee: { 
    type: Number, 
    required: true 
  } // e.g., 300
}, { _id: false });

// Primary Student Blueprint
const studentSchema = new mongoose.Schema({
  studentNo: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true 
  }, // e.g., "SDG1001"
  name: { 
    type: String, 
    required: true 
  }, // Learner's name
  password: { 
    type: String, 
    default: null 
  }, // Null allows first-time login verification flow
  missedExams: [missedExamSchema], // List of remaining exams to book
  bookings: [bookingSchema] // List of active bookings
}, { 
  timestamps: true // Automatically creates 'createdAt' and 'updatedAt' fields
});

module.exports = mongoose.model('Student', studentSchema);