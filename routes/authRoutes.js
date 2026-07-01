const express = require('express');
const router = express.Router();
const { verifyStudentStep1, setupPassword, loginStudent } = require('../controllers/authController');

// All entry points mapped cleanly to our brain controllers
router.post('/verify-step1', verifyStudentStep1);
router.post('/setup-password', setupPassword);
router.post('/login', loginStudent);

module.exports = router;