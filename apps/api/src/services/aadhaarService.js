const { isValidAadhaar } = require("../utils/validators");

const verifyAadhaarMock = async (aadhaarNumber) => {
  const normalized = String(aadhaarNumber || "");

  if (!isValidAadhaar(normalized)) {
    return {
      success: false,
      message: "Aadhaar number must contain exactly 12 digits.",
    };
  }

  if (/^(\d)\1{11}$/.test(normalized) || normalized.startsWith("0")) {
    return {
      success: false,
      message: "Mock Aadhaar verification rejected this number.",
    };
  }

  return {
    success: true,
    message: "Mock Aadhaar verification completed successfully.",
    referenceId: `AADH-${normalized.slice(-4)}-${Date.now()}`,
  };
};

module.exports = {
  verifyAadhaarMock,
};

