const express = require("express");

const { requireAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadAvatar,
  updateBaseCurrency,
} = require("../controllers/profileController");

const router = express.Router();

router.post("/avatar", requireAuth, upload.single("avatar"), uploadAvatar);
router.patch("/currency", requireAuth, updateBaseCurrency);

module.exports = router;
