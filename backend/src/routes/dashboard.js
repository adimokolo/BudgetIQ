const express = require('express');
const { getSummary, getDailyBreakdown } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', getSummary);
router.get('/daily', getDailyBreakdown);

module.exports = router;
