const express = require("express");
const {
  getTraders,
  getTraderById,
  toggleFavorite,
  copyTrader,
} = require("../controllers/traderController");
const { optionalAuth, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", optionalAuth, getTraders);
router.get("/:id", optionalAuth, getTraderById);
router.post("/:id/favorite", requireAuth, toggleFavorite);
router.post("/:id/copy", requireAuth, copyTrader);

module.exports = router;

