const express = require('express');
const { listNotifications, markRead, markAllRead } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', listNotifications);
router.patch('/:id/read', markRead);
router.post('/read-all', markAllRead);

module.exports = router;
