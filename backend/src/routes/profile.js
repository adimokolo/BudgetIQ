const express = require("express");

const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadAvatar } = require("../controllers/profileController");

const router = express.Router();

router.post("/avatar", requireAuth, upload.single("avatar"), uploadAvatar);

module.exports = router;
