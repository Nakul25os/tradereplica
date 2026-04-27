const bcrypt = require("bcryptjs");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const User = require("../models/User");
const env = require("../config/env");
const { verifyAadhaarMock } = require("../services/aadhaarService");
const { sendOtpEmail } = require("../services/mailService");
const { issueOtp, verifyOtp } = require("../services/otpService");
const { encryptAadhaar } = require("../utils/crypto");
const { signToken, sanitizeUser } = require("../utils/auth");
const {
  isValidEmail,
  isValidPassword,
  isValidAadhaar,
  isStrongEnoughUsername,
  maskEmail,
} = require("../utils/validators");

const normalizeIdentifier = (value) => String(value || "").trim().toLowerCase();

const buildMailMeta = (result) => ({
  deliveryMode: result.deliveryMode,
  ...(env.nodeEnv !== "production" && result.preview
    ? {
        preview: result.preview,
      }
    : {}),
  ...(env.nodeEnv !== "production" && result.devOtp
    ? {
        devOtp: result.devOtp,
      }
    : {}),
});

const signup = asyncHandler(async (req, res) => {
  const {
    username,
    email,
    password,
    confirmPassword,
    aadhaarNumber,
  } = req.body;

  const normalizedEmail = normalizeIdentifier(email);
  const normalizedUsername = normalizeIdentifier(username);

  if (!isStrongEnoughUsername(normalizedUsername)) {
    throw new HttpError(
      400,
      "Username must be 3-20 characters and can contain letters, numbers, and underscores."
    );
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new HttpError(400, "A valid email address is required.");
  }

  if (!isValidPassword(password)) {
    throw new HttpError(
      400,
      "Password must be at least 8 characters long."
    );
  }

  if (password !== confirmPassword) {
    throw new HttpError(400, "Passwords do not match.");
  }

  if (!isValidAadhaar(aadhaarNumber)) {
    throw new HttpError(400, "Aadhaar number must contain 12 digits.");
  }

  const aadhaarCheck = await verifyAadhaarMock(aadhaarNumber);

  if (!aadhaarCheck.success) {
    throw new HttpError(400, aadhaarCheck.message);
  }

  const [userByEmail, userByUsername] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    User.findOne({ username: normalizedUsername }),
  ]);

  if (
    userByUsername &&
    userByUsername.email !== normalizedEmail &&
    userByUsername.verified
  ) {
    throw new HttpError(409, "Username is already in use.");
  }

  if (userByEmail && userByEmail.username !== normalizedUsername && userByEmail.verified) {
    throw new HttpError(409, "Email is already in use.");
  }

  if (
    userByEmail &&
    userByUsername &&
    userByEmail._id.toString() !== userByUsername._id.toString()
  ) {
    throw new HttpError(
      409,
      "This email and username are already tied to different accounts."
    );
  }

  const targetUser = userByEmail || userByUsername || new User();
  targetUser.username = normalizedUsername;
  targetUser.email = normalizedEmail;
  targetUser.password = await bcrypt.hash(password, 10);
  targetUser.aadhaarNumber = encryptAadhaar(String(aadhaarNumber));
  targetUser.verified = false;

  await targetUser.save();

  const { otp } = await issueOtp({
    email: normalizedEmail,
    purpose: "email_verification",
  });
  const mailResult = await sendOtpEmail({
    email: normalizedEmail,
    otp,
    username: targetUser.username,
    purpose: "email_verification",
  });

  res.status(201).json({
    message:
      mailResult.deliveryMode === "smtp"
        ? `OTP sent to ${maskEmail(normalizedEmail)}. Verify it to activate the account.`
        : env.nodeEnv === "production"
          ? `Email delivery is not configured for this deployment. Ask support to enable SMTP for ${maskEmail(normalizedEmail)}.`
          : `Email delivery is running in local preview mode. Use the OTP shown on screen to activate the account for ${maskEmail(normalizedEmail)}.`,
    email: normalizedEmail,
    aadhaarReference: aadhaarCheck.referenceId,
    ...buildMailMeta(mailResult),
  });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeIdentifier(email);

  if (!otp) {
    throw new HttpError(400, "OTP is required.");
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new HttpError(404, "No account found for this email.");
  }

  const verification = await verifyOtp({
    email: normalizedEmail,
    otp,
    purpose: "email_verification",
  });

  if (!verification.valid) {
    throw new HttpError(400, verification.message);
  }

  user.verified = true;
  await user.save();

  res.json({
    message: "Email verified successfully. You can now log in.",
  });
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "email_verification" } = req.body;
  const normalizedEmail = normalizeIdentifier(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new HttpError(404, "No account found for this email.");
  }

  if (purpose === "email_verification" && user.verified) {
    throw new HttpError(400, "This account is already verified.");
  }

  const { otp } = await issueOtp({
    email: normalizedEmail,
    purpose,
  });
  const mailResult = await sendOtpEmail({
    email: normalizedEmail,
    otp,
    username: user.username,
    purpose,
  });

  res.json({
    message:
      mailResult.deliveryMode === "smtp"
        ? `A fresh OTP was sent to ${maskEmail(normalizedEmail)}.`
        : env.nodeEnv === "production"
          ? `Email delivery is not configured for this deployment. Ask support to enable SMTP for ${maskEmail(normalizedEmail)}.`
          : `A fresh OTP was generated in local preview mode for ${maskEmail(normalizedEmail)}.`,
    ...buildMailMeta(mailResult),
  });
});

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const query = normalizedIdentifier.includes("@")
    ? { email: normalizedIdentifier }
    : { username: normalizedIdentifier };

  const user = await User.findOne(query);

  if (!user) {
    throw new HttpError(401, "Invalid credentials.");
  }

  const passwordMatches = await bcrypt.compare(password || "", user.password);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid credentials.");
  }

  if (!user.verified) {
    throw new HttpError(
      403,
      "Verify your email with OTP before logging in."
    );
  }

  res.json({
    token: signToken(user),
    user: sanitizeUser(user),
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeIdentifier(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new HttpError(404, "No account found for this email.");
  }

  const { otp } = await issueOtp({
    email: normalizedEmail,
    purpose: "password_reset",
  });
  const mailResult = await sendOtpEmail({
    email: normalizedEmail,
    otp,
    username: user.username,
    purpose: "password_reset",
  });

  res.json({
    message:
      mailResult.deliveryMode === "smtp"
        ? `Password reset OTP sent to ${maskEmail(normalizedEmail)}.`
        : env.nodeEnv === "production"
          ? `Password reset email is not configured for this deployment. Ask support to enable SMTP for ${maskEmail(normalizedEmail)}.`
          : `Password reset is running in local preview mode for ${maskEmail(normalizedEmail)}. Use the OTP shown on screen.`,
    ...buildMailMeta(mailResult),
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password, confirmPassword } = req.body;
  const normalizedEmail = normalizeIdentifier(email);

  if (!isValidPassword(password)) {
    throw new HttpError(
      400,
      "Password must be at least 8 characters long."
    );
  }

  if (password !== confirmPassword) {
    throw new HttpError(400, "Passwords do not match.");
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new HttpError(404, "No account found for this email.");
  }

  const verification = await verifyOtp({
    email: normalizedEmail,
    otp,
    purpose: "password_reset",
  });

  if (!verification.valid) {
    throw new HttpError(400, verification.message);
  }

  user.password = await bcrypt.hash(password, 10);
  await user.save();

  res.json({
    message: "Password reset successful. You can now log in.",
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: sanitizeUser(req.user),
  });
});

module.exports = {
  signup,
  verifyEmail,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
