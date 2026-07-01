const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 🧠 IN-MEMORY DATABASE CACHE & FALLBACK ROSTER
let memoryDb = null;

const getDb = () => {
    if (memoryDb) return memoryDb;

    // 🗺️ Try resolving the path using both Vercel's root directory and the local directory
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
                    console.log(`🎯 Successfully anchored database from: ${targetPath}`);
                    return memoryDb;
                }
            }
        } catch (err) {
            console.error(`❌ Read skip on: ${targetPath}`, err);
        }
    }

    // 🛡️ ULTIMATE FAILSAFE COHORT DATA
    // If Vercel completely detaches the json file during compilation, this preserves the system functionality
    console.warn("⚠️ database.json untraceable or unreadable. Deploying live fallback cohort registry.");
    memoryDb = {
        students: [
            {
                studentNo: "SDG1001",
                name: "Thando Langa",
                password: null,
                missedExams: [
                    { id: "EUC101", name: "End User Computing", fee: 150 },
                    { id: "DC102", name: "Digital Citizenship", fee: 150 }
                ],
                bookings: []
            },
            {
                studentNo: "SDG1002",
                name: "Lineo Motaung",
                password: null,
                missedExams: [
                    { id: "EUC101", name: "End User Computing", fee: 150 }
                ],
                bookings: []
            },
            {
                studentNo: "SDG1003",
                name: "Ihsaan Motaung",
                password: "demo-password-123",
                missedExams: [],
                bookings: []
            }
        ]
    };
    return memoryDb;
};

const saveDb = (data) => {
    memoryDb = data; // Always keep the operational runtime cache synchronized
    
    const pathsToTry = [
        path.join(process.cwd(), 'database.json'),
        path.join(__dirname, 'database.json')
    ];

    for (const targetPath of pathsToTry) {
        try {
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
            return;
        } catch (error) {
            // Silently cycle through until running memory acts as the primary layer
        }
    }
    console.warn("⚠️ System Note: Persistent write skipped by read-only filesystem. State preserved in memory instance.");
};

app.use(cors());
app.use(express.json());

// 🔎 DIAGNOSTIC TRAFFIC LOGGER
app.use((req, res, next) => {
    console.log(`📡 Traffic Check: ${req.method} ${req.url}`);
    next();
});

// ==========================================
// CORE AUTHENTICATION ROUTERS
// ==========================================

app.post('/api/auth/verify', (req, res) => {
    const { studentNo } = req.body;
    const db = getDb();
    
    // Normalize user input formatting to eliminate casing errors
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);
    
    if (!student) {
        return res.status(404).json({ 
            message: `Student number "${studentNo}" not found in this cohort.` 
        });
    }
    
    res.json({ 
        name: student.name,
        hasPassword: student.password !== null 
    });
});

const handleAuthStep2 = (req, res) => {
    const { studentNo, password } = req.body;
    const db = getDb();
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });

    if (student.password === null) {
        student.password = password;
        saveDb(db);
        console.log(`🔐 Password configured successfully for ${student.name}`);
    } else if (student.password !== password) {
        console.log(`❌ Failed login attempt for ${student.name}`);
        return res.status(401).json({ message: 'Incorrect password.' });
    }

    console.log(`🚀 Successful session authenticated for ${student.name}`);

    const mockToken = `mock-session-token-${student.studentNo}-${Date.now()}`;
    const profileWithKeys = {
        ...student,
        _id: student.studentNo,
        id: student.studentNo,
        role: 'student'
    };

    res.json({
        ...profileWithKeys,
        user: profileWithKeys,
        student: profileWithKeys,
        token: mockToken,
        success: true
    });
};

app.post('/api/auth/login', handleAuthStep2);
app.post('/api/auth/setup-password', handleAuthStep2);

// ==========================================
// RESERVATION MANAGEMENT ROUTERS
// ==========================================

app.post('/api/bookings/reserve', (req, res) => {
    const { studentNo, examId, date, time } = req.body;
    const db = getDb();
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });

    const exam = student.missedExams.find(e => e.id === examId);
    if (!exam) return res.status(400).json({ message: 'Module already scheduled or unavailable.' });

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

app.use((req, res) => {
    res.status(404).json({ 
        message: `Oops! The frontend tried to hit a backend route that isn't defined yet: ${req.method} ${req.url}` 
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🌐 Production Engine live on Port: ${PORT}`));