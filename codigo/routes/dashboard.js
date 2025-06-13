const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

router.get('/api/dashboard', getDashboardStats);

module.exports = router; 