const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["deposit", "copy_allocation"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    method: {
      type: String,
      enum: ["bank_transfer", "upi_qr", "card", "copy_live"],
      required: true,
    },
    status: {
      type: String,
      enum: ["completed", "processing", "failed"],
      default: "completed",
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amountInr: {
      type: Number,
      default: null,
    },
    amountUsdt: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      default: "",
    },
    counterparty: {
      type: String,
      default: "",
    },
    bankReference: {
      type: String,
      default: "",
    },
    upiId: {
      type: String,
      default: "",
    },
    cardLast4: {
      type: String,
      default: "",
    },
    trader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trader",
      default: null,
    },
    traderName: {
      type: String,
      default: "",
    },
    marketType: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
