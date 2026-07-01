const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const dbPath = path.join(__dirname, 'database.json');

const getDb = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const saveDb = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

app.use(cors());
app.use(express.json());

// 🔎 DIAGNOSTIC LOGGER: Tracks what your interface is requesting
app.use((req, res, next) => {
    console.log(`📡 Incoming Traffic: ${req.method} ${req.url}`);
    next();
});

// ==========================================
// AUTHENTICATION MODULES
// ==========================================

// Step 1: Verify Student Number
app.post('/api/auth/verify-step1', (req, res) => {
    const { studentNo } = req.body;
    const db = getDb();
    const student = db.students.find(s => s.studentNo === studentNo);
    
    if (!student) return res.status(404).json({ message: 'Student number not found in this cohort.' });
    
    res.json({ 
        name: student.name,
        hasPassword: student.password !== null 
    });
});

// Universal Handler for Step 2 (Enhanced Auth Compatibility Layer)
const handleAuthStep2 = (req, res) => {
    const { studentNo, password } = req.body;
    const db = getDb();
    const student = db.students.find(s => s.studentNo === studentNo);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });

    // First time password setup
    if (student.password === null) {
        student.password = password;
        saveDb(db);
        console.log(`🔐 Password configured successfully for ${student.name}`);
    } else if (student.password !== password) {
        // Returning login check
        console.log(`❌ Failed login attempt (Wrong Password) for ${student.name}`);
        return res.status(401).json({ message: 'Incorrect password.' });
    }

    console.log(`🚀 Successful session authenticated for ${student.name}`);

    // Generate simulated database keys and security tokens
    const mockToken = `mock-session-token-${student.studentNo}-${Date.now()}`;
    const profileWithKeys = {
        ...student,
        _id: student.studentNo,
        id: student.studentNo,
        role: 'student'
    };

    // SHOTGUN RESPONSE: Formatted to satisfy flat structures, nested wrappers, and token checks
    res.json({
        ...profileWithKeys,
        user: profileWithKeys,
        student: profileWithKeys,
        token: mockToken,
        success: true
    });
};

// Catch any variant of the login/register/setup endpoints the frontend might call
app.post('/api/auth/login', handleAuthStep2);
app.post('/api/auth/register', handleAuthStep2);
app.post('/api/auth/setup-password', handleAuthStep2);
app.post('/api/auth/verify-step2', handleAuthStep2);

// ==========================================
// BOOKING MODULES
// ==========================================

app.post('/api/bookings/reserve', (req, res) => {
    const { studentNo, examId, date, time } = req.body;
    const db = getDb();
    const student = db.students.find(s => s.studentNo === studentNo);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });

    const exam = student.missedExams.find(e => e.id === examId);
    if (!exam) return res.status(400).json({ message: 'Module already scheduled.' });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    const expiryString = expiryDate.toISOString().split('T')[0];

    const newBooking = {
        id: `B-${studentNo}-${Date.now()}`,
        examId: exam.id,
        examName: exam.name,
        date,
        time,
        status: 'Conditional (Pending EFT)',
        expiresAt: expiryString,
        fee: exam.fee
    };

    student.bookings.push(newBooking);
    student.missedExams = student.missedExams.filter(e => e.id !== examId);
    saveDb(db);
    
    res.json({
        message: 'Conditional booking reserved successfully!',
        updatedStudent: student
    });
});

app.get('/api/bookings/slots', (req, res) => {
    const dates = [
        '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16',
        '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23',
        '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30'
    ];
    res.json(dates.map(d => ({ date: d, times: ['10:00 - 12:30', '13:00 - 15:30'] })));
});

// 🛡️ FALLBACK GUARD: Prevents HTML responses for missing routes
app.use((req, res) => {
    console.log(`⚠️ Unhandled Route Attempted: ${req.method} ${req.url}`);
    res.status(404).json({ 
        message: `Oops! The frontend tried to hit a backend route that isn't defined yet: ${req.method} ${req.url}` 
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🌐 Diagnostic Server live on Port: ${PORT}`));