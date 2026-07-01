const { localStudentsDatabase } = require('../config/mockDb');

exports.verifyStudentStep1 = async (req, res) => {
  try {
    const { studentNo } = req.body;
    if (!studentNo) return res.status(400).json({ message: 'Please enter a student number.' });

    const student = localStudentsDatabase.find(s => s.studentNo === studentNo.toUpperCase());
    if (!student) return res.status(404).json({ message: 'Student number not found in our records.' });

    return res.status(200).json({
      message: 'Student found.',
      name: student.name,
      isFirstTime: student.password === null
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

exports.setupPassword = async (req, res) => {
  try {
    const { studentNo, password } = req.body;
    if (!studentNo || !password) return res.status(400).json({ message: 'Missing fields.' });

    const student = localStudentsDatabase.find(s => s.studentNo === studentNo.toUpperCase());
    if (!student) return res.status(404).json({ message: 'Student tracking record missing.' });

    student.password = password;
    return res.status(200).json({
      message: 'Password created successfully!',
      student
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error processing password.' });
  }
};

exports.loginStudent = async (req, res) => {
  try {
    const { studentNo, password } = req.body;
    if (!studentNo || !password) return res.status(400).json({ message: 'Please provide both fields.' });

    const student = localStudentsDatabase.find(s => s.studentNo === studentNo.toUpperCase());
    if (!student || student.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    return res.status(200).json({ message: 'Authentication successful.', student });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during login.' });
  }
};