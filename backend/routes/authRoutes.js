const express = require("express");

const {
  register,
  login,
  getMe,
  getHrRequests,
  approveHr,
  rejectHr,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public authentication
router.post("/register", register);
router.post("/login", login);

// Current logged-in user
router.get("/me", authMiddleware, getMe);

// Admin-only HR registration management
router.get("/hr-requests", authMiddleware, getHrRequests);
router.patch("/hr-requests/:id/approve", authMiddleware, approveHr);
router.patch("/hr-requests/:id/reject", authMiddleware, rejectHr);

module.exports = router;