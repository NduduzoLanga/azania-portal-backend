const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

const officialExams = [
  { id: 'SDG-P1', name: 'SDG P1 - End-User Computing', fee: 200 },
  { id: 'SDG-P2', name: 'SDG P2 - Computer Basics & Navigation', fee: 150 },
  { id: 'SDG-P3', name: 'SDG P3 - FINAL PROJECT (SDG 11)', fee: 200 }
];

const cohortLearners = [
  { name: 'Mr. Thando Zalie', studentNo: 'A445870-017', parentEmail: 'idahzalie61@gmail.com' },
  { name: 'Mr. Lukwago Ntilane', studentNo: 'A445870-025', parentEmail: 'craneartupholstery@gmail.com' },
  { name: 'Mr. Thando Azande Khambule', studentNo: 'A445870-004', parentEmail: 'snenhlanhlakhambule@gmail.com' },
  { name: 'Mr. Qhawe Zwane', studentNo: 'A445870-006', parentEmail: 'marikazembe@gmail.com' },
  { name: 'Mr. Sibusiso Tafirrei Ngidi', studentNo: 'A445870-023', parentEmail: 'ngidimoipone8@gmail.com' },
  { name: 'Ms. Mbali Precious Radebe', studentNo: 'A445870-005', parentEmail: 'marikazembe@gmail.com' },
  { name: 'Ms. Bokamoso Mohale', studentNo: 'A445870-022', parentEmail: 'mohalepatriciah504@gmail.com' }
];

// Create the data structure
const data = {
  students: cohortLearners.map(l => ({
    ...l,
    password: null,
    missedExams: officialExams,
    bookings: []
  }))
};

// Write directly to the JSON file
fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
console.log('🏁 Success! 7 learners seeded to database.json');