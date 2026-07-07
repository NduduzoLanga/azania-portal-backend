const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

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
                    console.log(`🎯 Successfully anchored database from: ${targetPath}`);
                    return memoryDb;
                }
            }
        } catch (err) {
            console.error(`❌ Read skip on: ${targetPath}`, err);
        }
    }

    // 🛡️ ULTIMATE FAILSAFE COHORT DATA
    console.warn("⚠️ database.json untraceable or unreadable. Deploying live fallback cohort registry.");
    memoryDb = {
        students: [
            {
                studentNo: "SDG1001",
                name: "Thando Langa",
                password: "password123",
                missedExams: [
                    { id: "EUC101", name: "End User Computing", fee: 150 },
                    { id: "DC102", name: "Digital Citizenship", fee: 150 }
                ],
                bookings: [
                    {
                        id: "B-SDG1001-1719820000000",
                        examId: "DC102",
                        examName: "Digital Citizenship",
                        date: "2026-07-14",
                        time: "10:00 - 12:30",
                        status: "Conditional (Pending EFT)",
                        expiresAt: "2026-07-21",
                        fee: 150
                    }
                ]
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
                bookings: [
                    {
                        id: "B-SDG1003-1719830000000",
                        examId: "EUC101",
                        examName: "End User Computing",
                        date: "2026-07-20",
                        time: "13:00 - 15:30",
                        status: "Approved (Paid)",
                        expiresAt: "2026-07-27",
                        fee: 150
                    }
                ]
            }
        ]
    };
    return memoryDb;
};

const saveDb = (data) => {
    memoryDb = data; 
    const pathsToTry = [ path.join(process.cwd(), 'database.json'), path.join(__dirname, 'database.json') ];
    for (const targetPath of pathsToTry) {
        try {
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
            return;
        } catch (error) {
            // Memory takes priority
        }
    }
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
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);
    
    if (!student) return res.status(404).json({ message: `Student number "${studentNo}" not found.` });
    
    res.json({ name: student.name, hasPassword: student.password !== null });
});

app.post('/api/auth/login', (req, res) => {
    const { studentNo, password } = req.body;
    const db = getDb();
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });
    if (student.password !== password) return res.status(401).json({ message: 'Incorrect password.' });

    const mockToken = `mock-session-token-${student.studentNo}-${Date.now()}`;
    res.json({ ...student, token: mockToken, success: true });
});

// ==========================================
// RESERVATION MANAGEMENT ROUTERS
// ==========================================
app.post('/api/bookings/reserve', (req, res) => {
    const { studentNo, examId, date, time } = req.body;
    const db = getDb();
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });

    // Handle duplicate checks for reschedule overrides vs new bookings
    student.bookings = student.bookings.filter(b => b.examId !== examId);

    const exam = student.missedExams.find(e => e.id === examId) || { id: examId, name: examId, fee: 150 };
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const newBooking = {
        id: `B-${studentNo}-${Date.now()}`,
        examId: exam.id,
        examName: exam.name || examId,
        date,
        time,
        status: 'Conditional (Pending EFT)',
        expiresAt: expiryDate.toISOString().split('T')[0],
        fee: exam.fee || 150
    };

    student.bookings.push(newBooking);
    student.missedExams = student.missedExams.filter(e => e.id !== examId);
    saveDb(db);
    
    res.json({ message: 'Seat reserved successfully!', updatedStudent: student });
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
// 👑 ADMINISTRATIVE ACCESS ROUTERS
// ==========================================

// Get complete global ledger for all students and bookings
app.get('/api/admin/students', (req, res) => {
    res.json(getDb().students);
});

// Update booking status or date/time parameters administratively
app.post('/api/admin/bookings/update', (req, res) => {
    const { studentNo, bookingId, status, date, time } = req.body;
    const db = getDb();
    const student = db.students.find(s => s.studentNo.toUpperCase() === studentNo.toUpperCase());

    if (!student) return res.status(404).json({ message: 'Student parameter not found.' });
    
    const booking = student.bookings.find(b => b.id === bookingId);
    if (!booking) return res.status(404).json({ message: 'Target entry ticket voucher missing.' });

    if (status) booking.status = status;
    if (date) booking.date = date;
    if (time) booking.time = time;

    saveDb(db);
    res.json({ message: 'Administrative parameters modified successfully!', students: db.students });
});

app.use((req, res) => {
    res.status(404).json({ message: `Route undefined: ${req.method} ${req.url}` });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🌐 Production Engine live on Port: ${PORT}`));