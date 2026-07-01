const API_BASE = 'http://localhost:5000/api';

async function runSystemTest() {
  console.log('🧪 Starting Full System Integration Test...\n');

  try {
    // --- STEP 1: Verify Student ---
    console.log('🔄 Step 1: Verifying First-Time Student (SDG1001)...');
    const verifyRes = await fetch(`${API_BASE}/auth/verify-step1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentNo: 'SDG1001' })
    });
    const verifyData = await verifyRes.json();
    console.log('✅ Response:', verifyData);
    console.log(`👉 UI Action: Is First Time? ${verifyData.isFirstTime} -> Show Password Setup Screen\n`);

    // --- STEP 2: Setup Password ---
    console.log('🔄 Step 2: Creating Password for Student...');
    const setupRes = await fetch(`${API_BASE}/auth/setup-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentNo: 'SDG1001', password: 'myNewSecurePassword2026' })
    });
    const setupData = await setupRes.json();
    console.log('✅ Response: Password successfully initialized.');
    console.log(`👉 Outstanding Exams Left to Book:`, setupData.student.missedExams, '\n');

    // --- STEP 3: Fetch Available Slots ---
    console.log('🔄 Step 3: Fetching Calendar Grid Roster...');
    const slotsRes = await fetch(`${API_BASE}/bookings/slots`);
    const slotsData = await slotsRes.json();
    console.log('✅ Response: Found calendar slots:');
    console.log(`👉 Available Dates:`, slotsData.map(s => s.date), '\n');

    // --- STEP 4: Reserve an Exam ---
    const targetDate = slotsData[0].date; // 2026-07-06
    const targetTime = slotsData[0].times[0]; // 09:00 AM
    console.log(`🔄 Step 4: Booking 'P1' for ${targetDate} at ${targetTime}...`);
    
    const bookRes = await fetch(`${API_BASE}/bookings/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentNo: 'SDG1001',
        examId: 'P1',
        date: targetDate,
        time: targetTime
      })
    });
    const bookData = await bookRes.json();
    console.log('🎉 Integration Test Complete! Final Student State:');
    console.log('👉 Active Bookings:', bookData.updatedStudent.bookings);
    console.log('👉 Remaining Missed Exams:', bookData.updatedStudent.missedExams);

  } catch (error) {
    console.error('❌ Test failed due to an error:', error.message);
  }
}

runSystemTest();