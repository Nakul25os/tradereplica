const dotenv = require("dotenv");

dotenv.config();

const splitCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  clientUrls: splitCsv(process.env.CLIENT_URLS).length
    ? splitCsv(process.env.CLIENT_URLS)
    : [process.env.CLIENT_URL || "http://localhost:3000"],
  mongoUri:
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tradereplica",
  useInMemoryMongo: process.env.USE_IN_MEMORY_MONGO === "true",
  jwtSecret: process.env.JWT_SECRET || "replace-this-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  otpExpiryMinutes: Number(process.env.OTP_EXPIRY_MINUTES || 10),
  aadhaarEncryptionKey:
    process.env.AADHAAR_ENCRYPTION_KEY ||
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from:
      process.env.SMTP_FROM ||
      "TradeReplica <no-reply@tradereplica.local>",
  },
  seedSampleData: process.env.SEED_SAMPLE_DATA !== "false",
  inrPerUsdt: Number(process.env.INR_PER_USDT || 88.5),
};

env.smtpConfigured = Boolean(
  env.smtp.host && env.smtp.user && env.smtp.pass
);

if (env.nodeEnv === "production") {
  if (env.useInMemoryMongo) {
    throw new Error(
      "USE_IN_MEMORY_MONGO cannot be enabled in production. Configure a real MONGODB_URI."
    );
  }

  if (!process.env.MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is required in production so TradeReplica can use a persistent database."
    );
  }
}

module.exports = env;
