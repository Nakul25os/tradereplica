const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    trader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      required: true,
    },
    marketType: {
      type: String,
      enum: ["Indian Stock Market", "Forex Market", "Crypto Market"],
      required: true,
    },
    instrument: {
      type: String,
      required: true,
    },
    positionType: {
      type: String,
      enum: ["Long", "Short"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      required: true,
    },
    openTime: {
      type: Date,
      required: true,
    },
    closeTime: {
      type: Date,
      default: null,
    },
    entryPrice: {
      type: Number,
      required: true,
    },
    exitPrice: {
      type: Number,
      default: null,
    },
    avgClosePrice: {
      type: Number,
      default: null,
    },
    maxOpenInterest: {
      type: Number,
      default: 0,
    },
    closedVolume: {
      type: Number,
      default: 0,
    },
    pnl: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

tradeSchema.index({ trader: 1, openTime: -1 });

module.exports = mongoose.model("Trade", tradeSchema);
