const express = require("express");
const {
  signup,
  verifyEmail,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", requireAuth, getCurrentUser);

module.exports = router;

