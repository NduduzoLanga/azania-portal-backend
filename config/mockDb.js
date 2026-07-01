// Centralized in-memory data store for offline development
let localStudentsDatabase = [
  {
    studentNo: "SDG1001",
    name: "Sipho Nkosi",
    password: null, // First-time setup user
    missedExams: [
      { id: "P1", name: "SDG 11 Paper 1 (Theory)", fee: 300 },
      { id: "P2", name: "SDG 11 Paper 2 (Practical)", fee: 250 }
    ],
    bookings: []
  },
  {
    studentNo: "SDG1003",
    name: "Lerato Dlamini",
    password: "securepassword123", // Returning user
    missedExams: [
      { id: "P1", name: "SDG 11 Paper 1 (Theory)", fee: 300 }
    ],
    bookings: [
      {
        id: "B-SDG1003-1719782400",
        examId: "P2",
        examName: "SDG 11 Paper 2 (Practical)",
        fee: 250,
        date: "2026-07-06",
        time: "09:00 AM",
        paymentStatus: "Paid",
        outcome: "Confirmed"
      }
    ]
  }
];

// Available calendar slots roster for July 2026
let localSlotsDatabase = [
  { date: "2026-07-06", times: ["09:00 AM", "11:00 AM", "14:00 PM"] },
  { date: "2026-07-07", times: ["09:00 AM", "11:00 AM"] },
  { date: "2026-07-08", times: ["11:00 AM", "14:00 PM"] }
];

module.exports = {
  localStudentsDatabase,
  localSlotsDatabase
};