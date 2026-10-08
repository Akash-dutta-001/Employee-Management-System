const express = require("express");
const rateLimit = require("express-rate-limit");

const {
  register,
  login,
  getMe,
  getHrRequests,
  approveHr,
  rejectHr,
  forgotPassword,
  resetPassword,
  verifyEmail,
  requestAdminEmailChange,
  verifyNewAdminEmail,
  createAdmin,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many password reset attempts. Please try again later.",
  },
});

router.post("/register", register);
router.get("/verify-email/:token", verifyEmail);
router.get("/verify-new-email/:token", verifyNewAdminEmail);
router.post("/login", login);

router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password/:token", passwordResetLimiter, resetPassword);

router.get("/me", authMiddleware, getMe);

router.post("/admin/change-email", authMiddleware, requestAdminEmailChange);
router.post("/admin/create", authMiddleware, createAdmin);

router.get("/hr-requests", authMiddleware, getHrRequests);
router.patch("/hr-requests/:id/approve", authMiddleware, approveHr);
router.patch("/hr-requests/:id/reject", authMiddleware, rejectHr);

module.exports = router;