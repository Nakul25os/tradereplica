const mongoose = require("mongoose");

const timelinePointSchema = new mongoose.Schema(
  {
    label: String,
    roi: Number,
    pnl: Number,
  },
  { _id: false }
);

const assetAllocationSchema = new mongoose.Schema(
  {
    asset: String,
    allocation: Number,
  },
  { _id: false }
);

const copyTraderSchema = new mongoose.Schema(
  {
    alias: String,
    mode: {
      type: String,
      enum: ["live", "mock"],
      default: "live",
    },
    amount: Number,
    startedAt: Date,
  },
  { _id: false }
);

const traderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    portfolioName: {
      type: String,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    translation: {
      type: String,
      default: "",
    },
    riskTag: {
      type: String,
      default: "Moderate Risk",
    },
    marketType: {
      type: String,
      enum: ["Indian Stock Market", "Forex Market", "Crypto Market"],
      required: true,
    },
    location: {
      city: String,
      country: String,
    },
    status: {
      type: String,
      enum: ["online", "away", "offline"],
      default: "online",
    },
    profileImage: {
      type: String,
      default: "",
    },
    dailyPick: {
      type: Boolean,
      default: false,
    },
    followers: {
      current: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 100,
      },
      total: {
        type: Number,
        default: 0,
      },
      mock: {
        type: Number,
        default: 0,
      },
    },
    performance: {
      pnl30d: Number,
      roi30d: Number,
      aum: Number,
      mdd: Number,
      sharpeRatio: Number,
      copierPnl: Number,
      winRate: Number,
      winPositions: Number,
      totalPositions: Number,
      timeline: [timelinePointSchema],
    },
    overview: {
      profitSharing: Number,
      leadingMarginBalance: Number,
      minimumCopyAmount: Number,
    },
    stats: {
      daysTrading: Number,
      closedPortfolios: Number,
    },
    assetAllocation: [assetAllocationSchema],
    copyTraders: [copyTraderSchema],
  },
  {
    timestamps: true,
  }
);

traderSchema.index({ marketType: 1, dailyPick: 1 });
traderSchema.index({ "performance.pnl30d": -1 });

module.exports = mongoose.model("Trader", traderSchema);
