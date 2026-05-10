// server/src/routes/auth.routes.js
const express = require('express');
const { register, login, getMe } = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../middleware/auth.validator');
const { protect } = require('../middleware/auth.middleware'); // Phase 3 Step 3

const router = express.Router();

// Public routes — no token required
router.post('/register', registerRules, register);
router.post('/login', loginRules, login);

// Protected route — token required
router.get('/me', protect, getMe);

module.exports = router;
