const OtpCode = require("../models/OtpCode");
const env = require("../config/env");
const { hashOtp } = require("../utils/crypto");

const generateOtp = () =>
  `${Math.floor(100000 + Math.random() * 900000)}`;

const issueOtp = async ({ email, purpose }) => {
  const otp = generateOtp();
  const expiresAt = new Date(
    Date.now() + env.otpExpiryMinutes * 60 * 1000
  );

  await OtpCode.deleteMany({ email, purpose });
  await OtpCode.create({
    email,
    purpose,
    otpHash: hashOtp(otp),
    expiresAt,
  });

  return {
    otp,
    expiresAt,
  };
};

const verifyOtp = async ({ email, otp, purpose }) => {
  const record = await OtpCode.findOne({ email, purpose }).sort({
    createdAt: -1,
  });

  if (!record) {
    return {
      valid: false,
      message: "OTP not found. Request a new code.",
    };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await OtpCode.deleteMany({ email, purpose });

    return {
      valid: false,
      message: "OTP expired. Request a fresh code.",
    };
  }

  if (record.otpHash !== hashOtp(otp)) {
    return {
      valid: false,
      message: "Invalid OTP.",
    };
  }

  await OtpCode.deleteMany({ email, purpose });

  return {
    valid: true,
  };
};

module.exports = {
  issueOtp,
  verifyOtp,
};

