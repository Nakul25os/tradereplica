const express = require("express");
const { createDeposit, getWalletOverview } = require("../controllers/walletController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", requireAuth, getWalletOverview);
router.post("/deposits", requireAuth, createDeposit);

module.exports = router;
