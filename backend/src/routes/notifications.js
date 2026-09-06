const express = require("express");
const {
  listNotifications,
  createNotification,
  markRead,
  markAllRead,
  removeNotification,
  removeAllNotifications,
} = require("../controllers/notificationController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", listNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markRead);
router.post("/read-all", markAllRead);
router.delete("/:id", removeNotification);
router.delete("/", removeAllNotifications);

module.exports = router;
