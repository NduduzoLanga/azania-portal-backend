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

    console.warn("⚠️ database.json untraceable or unreadable. Deploying live fallback cohort registry.");
    memoryDb = {
        students: [
            {
                studentNo: "SDG1001",
                name: "Thando Langa",
                password: "password123",
                missedExams: [
                    { id: "DC102", name: "Digital Citizenship", fee: 150 }
                ],
                bookings: [
                    {
                        id: "B-SDG1001-1719999999999",
                        examId: "EUC101",
                        examName: "End User Computing",
                        date: "2026-07-14",
                        time: "10:00 - 12:30",
                        status: "Conditional (Pending EFT)",
                        expiresAt: "2026-07-15",
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
                        id: "B-SDG1003-1719888888888",
                        examId: "SDG11",
                        examName: "SDG 11 Sustainable Cities",
                        date: "2026-07-21",
                        time: "13:00 - 15:30",
                        status: "Approved",
                        expiresAt: "2026-07-28",
                        fee: 200
                    }
                ]
            }
        ]
    };
    return memoryDb;
};

const saveDb = (data) => {
    memoryDb = data;
    const pathsToTry = [
        path.join(process.cwd(), 'database.json'),
        path.join(__dirname, 'database.json')
    ];
    for (const targetPath of pathsToTry) {
        try {
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
            return;
        } catch (error) {
            // Memory takes over if workspace filesystem locks
        }
    }
};

app.use(cors());
app.use(express.json());

// ==========================================
// STUDENT PROFILE APIS
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

    res.json({ student, success: true, role: 'student' });
});

app.post('/api/bookings/reserve', (req, res) => {
    const { studentNo, examId, date, time } = req.body;
    const db = getDb();
    const lookupKey = studentNo ? studentNo.trim().toUpperCase() : '';
    const student = db.students.find(s => s.studentNo.toUpperCase() === lookupKey);

    if (!student) return res.status(404).json({ message: 'Student profile missing.' });

    // Handle incoming parameters from both booking creation or reschedule overrides
    let exam = student.missedExams.find(e => e.id === examId);
    let existingBookingIdx = student.bookings.findIndex(b => b.examId === examId);

    if (existingBookingIdx !== -1) {
        // Edit/Reschedule Loop
        student.bookings[existingBookingIdx].date = date;
        student.bookings[existingBookingIdx].time = time;
        saveDb(db);
        return res.json({ message: 'Seat reallocated successfully!', updatedStudent: student });
    }

    if (!exam) return res.status(400).json({ message: 'Module allocation error.' });

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
    
    res.json({ message: 'Conditional booking reserved successfully!', updatedStudent: student });
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
// 🛡️ NEW ADMINISTRATIVE OVERRIDE MODULES
// ==========================================

// Fetch all dataset nodes for registry monitoring dashboard
app.get('/api/admin/students', (req, res) => {
    const db = getDb();
    res.json(db.students);
});

// Force change state values on target records across students array
app.post('/api/admin/bookings/update', (req, res) => {
    const { studentNo, bookingId, status, date, time } = req.body;
    const db = getDb();
    const student = db.students.find(s => s.studentNo.toUpperCase() === studentNo.toUpperCase());

    if (!student) return res.status(404).json({ message: 'Student parameter invalid.' });
    
    const booking = student.bookings.find(b => b.id === bookingId);
    if (!booking) return res.status(404).json({ message: 'Target entry slip not found.' });

    // Apply corporate overrides
    if (status) booking.status = status;
    if (date) booking.date = date;
    if (time) booking.time = time;

    saveDb(db);
    res.json({ message: 'Administrative record updated successfully!', students: db.students });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🌐 Administrative Engine running on Port: ${PORT}`));