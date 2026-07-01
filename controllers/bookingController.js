const { localStudentsDatabase, localSlotsDatabase } = require('../config/mockDb');

// 1. Fetch all available slots for the calendar view
exports.getAvailableSlots = async (req, res) => {
  try {
    return res.status(200).json(localSlotsDatabase);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load scheduling calendar.' });
  }
};

// 2. Process an exam registration booking
exports.createBooking = async (req, res) => {
  try {
    const { studentNo, examId, date, time } = req.body;

    if (!studentNo || !examId || !date || !time) {
      return res.status(400).json({ message: 'Missing allocation parameters.' });
    }

    // Find the student
    const student = localStudentsDatabase.find(s => s.studentNo === studentNo.toUpperCase());
    if (!student) return res.status(404).json({ message: 'Student profile not found.' });

    // Verify the student actually needs to write this exam
    const examIndex = student.missedExams.findIndex(e => e.id === examId);
    if (examIndex === -1) {
      return res.status(400).json({ message: 'This exam is not flagged for supplementary scheduling.' });
    }

    const targetedExam = student.missedExams[examIndex];

    // Build the dynamic transaction package
    const newBooking = {
      id: `B-${student.studentNo}-${Date.now()}`, // Generated sequential ID timestamp
      examId: targetedExam.id,
      examName: targetedExam.name,
      fee: targetedExam.fee,
      date,
      time,
      paymentStatus: 'Pending',
      outcome: 'Conditionally Accepted'
    };

    // Commit changes: Add to bookings, pull from outstanding missed exams list
    student.bookings.push(newBooking);
    student.missedExams.splice(examIndex, 1);

    return res.status(201).json({
      message: 'Booking reserved successfully! Redirecting to payment confirmation dashboard.',
      updatedStudent: student
    });

  } catch (error) {
    return res.status(500).json({ message: 'Server error compiling reservation request.' });
  }
};