const mongoose = require("mongoose");

const encryptedAadhaarSchema = new mongoose.Schema(
  {
    iv: { type: String, required: true },
    content: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { _id: false }
);

const copiedPortfolioSchema = new mongoose.Schema(
  {
    trader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      required: true,
    },
    mode: {
      type: String,
      enum: ["live", "mock"],
      default: "mock",
    },
    amount: {
      type: Number,
      default: 250,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    aadhaarNumber: {
      type: encryptedAadhaarSchema,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Trader",
      },
    ],
    copiedPortfolios: [copiedPortfolioSchema],
    wallet: {
      marginBalance: {
        type: Number,
        default: 0,
      },
      availableBalance: {
        type: Number,
        default: 0,
      },
      copyLockedBalance: {
        type: Number,
        default: 0,
      },
      totalDeposited: {
        type: Number,
        default: 0,
      },
      unrealizedPnl: {
        type: Number,
        default: 0,
      },
      lastFundingAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
