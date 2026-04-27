const validator = require("validator");

const isValidEmail = (email) => validator.isEmail(String(email || ""));

const isValidPassword = (password) =>
  typeof password === "string" && password.length >= 8;

const isValidAadhaar = (aadhaarNumber) =>
  /^\d{12}$/.test(String(aadhaarNumber || ""));

const isStrongEnoughUsername = (username) =>
  typeof username === "string" && /^[a-zA-Z0-9_]{3,20}$/.test(username);

const maskEmail = (email) => {
  const [local, domain] = String(email || "").split("@");

  if (!local || !domain) {
    return email;
  }

  return `${local.slice(0, 2)}***@${domain}`;
};

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidAadhaar,
  isStrongEnoughUsername,
  maskEmail,
};

