const express = require('express');
const { getSummary } = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/summary', getSummary);

module.exports = router;
