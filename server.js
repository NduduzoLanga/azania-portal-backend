const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 🧠 IN-MEMORY DATABASE CACHE & FALLBACK ROSTER
let memoryDb = null;

const getDb = () => {
    if (memoryDb) return memoryDb;

    const pathsToTry = [
        path.join(process.cwd(), 'database.json'),
        path.join(__dirname, 'database.json')
    ];

    for (const targetPath of pathsToTry) {
        try {
            if (fs.existsSync(targetPath)) {
                const content = fs.readFileSync(targetPath, 'utf8');
                if (content.trim()) {
                    memoryDb = JSON.parse(content);
                    console.log(`🎯 Database anchored from: ${targetPath}`);
                    return memoryDb;
                }
            }
        } catch (err) {
            console.error(`❌ Read skip on: ${targetPath}`, err);
        }
    }

    // Baseline Fallback Template
    memoryDb = {
        students: [
            {
                studentNo: "SDG1001",
                name: "Thando Langa",
                password: "password123",
                missedExams: [{ id: "DC102", name: "Digital Citizenship", fee: 150 }],
                bookings: []
            }
        ]
    };
    return memoryDb;
};

const saveDb = (data) => {
    memoryDb = data;
    const pathsToTry = [path.join(process.cwd(), 'database.json'), path.join(__dirname, 'database.json')];
    for (const targetPath of pathsToTry) {
        try {
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
            return;
        } catch (error) {
            // Memory handles if disk locks
        }
    }
};

// ==========================================
// AUTHENTICATION ENGINE (WITH ADMIN INTERCEPT)
// ==========================================

// 1. Verify Student Existence or Identity Check
app.post('/api/auth/verify', (req, res) => {
    const { studentNo } = req.body;
    if (!studentNo) return res.status(400).json({ message: 'Identifier input is required.' });

    // Intercept Admin Identifier checking
    if (studentNo.trim().toLowerCase() === 'admin@azaniaparagon.co.za') {
        return res.json({ name: "System Administrator", hasPassword: true, role: 'admin' });
    }

    const db = getDb();
    const lookupKey = studentNo.trim().toUpperCase();
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);
    
    if (!student) {
        // Automatically create a blank dummy profile parameters framework to prevent database crashes
        const newDummy = {
            studentNo: lookupKey,
            name: `New Learner (${lookupKey})`,
            password: null,
            missedExams: [
                { id: "EUC101", name: "End User Computing", fee: 150 },
                { id: "DC102", name: "Digital Citizenship", fee: 150 }
            ],
            bookings: []
        };
        db.students.push(newDummy);
        saveDb(db);
        return res.json({ name: newDummy.name, hasPassword: false, role: 'student' });
    }
    
    res.json({ name: student.name, hasPassword: student.password !== null, role: 'student' });
});

// 2. Setup Password for profiles lacking credentials
app.post('/api/auth/setup-password', (req, res) => {
    const { studentNo, password } = req.body;
    const db = getDb();
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);

    if (!student) return res.status(404).json({ message: 'Profile record untraceable.' });

    student.password = password;
    saveDb(db);

    // 🎯 FIXED: Aligned data scheme to match login signature exactly
    res.json({ 
        success: true, 
        message: 'Password configured successfully!', 
        user: student, 
        role: 'student' 
    });
});

// 3. Consolidated Login Gate
app.post('/api/auth/login', (req, res) => {
    const { studentNo, password } = req.body;
    
    // 🔐 MASTER ADMINISTRATIVE CREDENTIAL CHECK
    if (studentNo.trim().toLowerCase() === 'admin@azaniaparagon.co.za' && password === 'AzaniaAdmin#2026') {
        return res.json({ 
            success: true, 
            role: 'admin', 
            user: { name: "System Administrator", studentNo: "ADMIN-MASTER" } 
        });
    }

    const db = getDb();
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });
    if (student.password !== password) return res.status(401).json({ message: 'Incorrect credentials.' });

    res.json({ success: true, role: 'student', user: student });
});

// ==========================================
// CORE BOOKING MANAGEMENT OPERATIONS
// ==========================================

app.post('/api/bookings/reserve', (req, res) => {
    const { studentNo, examId, date, time } = req.body;
    const db = getDb();
    const student = db.students.find(s => s.studentNo.toUpperCase() === studentNo.toUpperCase());

    if (!student) return res.status(404).json({ message: 'Student missing.' });

    let existingBookingIdx = student.bookings.findIndex(b => b.examId === examId);
    if (existingBookingIdx !== -1) {
        student.bookings[existingBookingIdx].date = date;
        student.bookings[existingBookingIdx].time = time;
        saveDb(db);
        return res.json({ message: 'Allocation reassigned!', updatedStudent: student });
    }

    let exam = student.missedExams.find(e => e.id === examId);
    if (!exam) return res.status(400).json({ message: 'Module reference error.' });

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const newBooking = {
        id: `B-${studentNo}-${Date.now()}`,
        examId: exam.id,
        examName: exam.name,
        date,
        time,
        status: 'Conditional (Pending EFT)',
        expiresAt: expiryDate.toISOString().split('T')[0],
        fee: exam.fee
    };

    student.bookings.push(newBooking);
    student.missedExams = student.missedExams.filter(e => e.id !== examId);
    saveDb(db);
    
    res.json({ message: 'Seat reserved conditionally!', updatedStudent: student });
});

app.get('/api/bookings/slots', (req, res) => {
    const dates = [
        '2026-07-13', '2026-07-14', '2026-07-15', '2026-07-16',
        '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23',
        '2026-07-27', '2026-07-28', '2026-07-29', '2026-07-30'
    ];
    res.json(dates.map(d => ({ date: d, times: ['10:00 - 12:30', '13:00 - 15:30'] })));
});

// ==========================================
// ADMINISTRATIVE OVERRIDE DECK
// ==========================================

app.get('/api/admin/students', (req, res) => {
    res.json(getDb().students);
});

app.post('/api/admin/bookings/update', (req, res) => {
    const { studentNo, bookingId, status, date, time } = req.body;
    const db = getDb();
    const student = db.students.find(s => s.studentNo.toUpperCase() === studentNo.toUpperCase());

    if (!student) return res.status(404).json({ message: 'Target profile invalid.' });
    const booking = student.bookings.find(b => b.id === bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking reservation reference invalid.' });

    if (status) booking.status = status;
    if (date) booking.date = date;
    if (time) booking.time = time;

    saveDb(db);
    res.json({ message: 'Record overwrites committed successfully.', students: db.students });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Secure Server engine unified on Port: ${PORT}`));