const express = require("express");
const { verifyAadhaarMock } = require("../services/aadhaarService");

const router = express.Router();

router.post("/aadhaar/verify", async (req, res) => {
  const result = await verifyAadhaarMock(req.body.aadhaarNumber);

  if (!result.success) {
    return res.status(400).json(result);
  }

  return res.json(result);
});

module.exports = router;

