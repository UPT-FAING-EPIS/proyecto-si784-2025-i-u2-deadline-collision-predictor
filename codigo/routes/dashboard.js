const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/api/dashboard', auth, getDashboardStats);

module.exports = router; 