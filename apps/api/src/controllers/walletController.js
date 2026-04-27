const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const WalletTransaction = require("../models/WalletTransaction");
const { buildWalletSnapshot, convertInrToUsdt, ensureWalletState, roundMoney } = require("../utils/wallet");
const { formatWalletTransaction, methodLabels } = require("../utils/walletTransformers");

const supportedMethods = new Set(["bank_transfer", "upi_qr", "card"]);

const generateReferenceId = (prefix) =>
  `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const loadWalletResponse = async (user) => {
  const transactions = await WalletTransaction.find({ user: user._id })
    .sort({ createdAt: -1 })
    .limit(12);

  return {
    wallet: buildWalletSnapshot(user.wallet),
    transactions: transactions.map(formatWalletTransaction),
  };
};

const validateAmountInr = (value) => {
  const amountInr = Number(value);

  if (!Number.isFinite(amountInr) || amountInr < 500) {
    throw new HttpError(400, "Deposit amount must be at least 500 INR.");
  }

  if (amountInr > 1000000) {
    throw new HttpError(400, "Deposit amount exceeds the single-transfer limit.");
  }

  return roundMoney(amountInr);
};

const validateDepositMetadata = (method, body) => {
  const accountHolderName = String(body.accountHolderName || "").trim();

  if (accountHolderName.length < 3) {
    throw new HttpError(400, "Account holder name is required.");
  }

  if (method === "bank_transfer") {
    const bankReference = String(body.bankReference || "").trim().toUpperCase();

    if (bankReference.length < 6) {
      throw new HttpError(400, "Bank reference number must be at least 6 characters.");
    }

    return {
      accountHolderName,
      bankReference,
      note: "Bank transfer settled to trading wallet.",
    };
  }

  if (method === "upi_qr") {
    const upiId = String(body.upiId || "").trim().toLowerCase();

    if (!/^[a-z0-9.\-_]{2,}@[a-z]{2,}$/i.test(upiId)) {
      throw new HttpError(400, "Enter a valid UPI ID.");
    }

    return {
      accountHolderName,
      upiId,
      note: "UPI funding credited to trading wallet.",
    };
  }

  const digits = String(body.cardNumber || "").replace(/\D/g, "");
  const expiry = String(body.expiry || "").trim();
  const cvv = String(body.cvv || "").trim();

  if (digits.length < 12 || digits.length > 19) {
    throw new HttpError(400, "Enter a valid card number.");
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    throw new HttpError(400, "Card expiry must be in MM/YY format.");
  }

  if (!/^\d{3,4}$/.test(cvv)) {
    throw new HttpError(400, "Enter a valid CVV.");
  }

  return {
    accountHolderName,
    cardLast4: digits.slice(-4),
    note: "Card funding credited to trading wallet.",
  };
};

const getWalletOverview = asyncHandler(async (req, res) => {
  const { changed } = ensureWalletState(req.user);

  if (changed) {
    await req.user.save();
  }

  res.json(await loadWalletResponse(req.user));
});

const createDeposit = asyncHandler(async (req, res) => {
  const method = String(req.body.method || "").trim();

  if (!supportedMethods.has(method)) {
    throw new HttpError(400, "Select a valid deposit method.");
  }

  ensureWalletState(req.user);

  const amountInr = validateAmountInr(req.body.amountInr);
  const amountUsdt = convertInrToUsdt(amountInr);
  const metadata = validateDepositMetadata(method, req.body);
  const nextWallet = {
    ...req.user.wallet,
    availableBalance: roundMoney(req.user.wallet.availableBalance + amountUsdt),
    marginBalance: roundMoney(req.user.wallet.marginBalance + amountUsdt),
    totalDeposited: roundMoney(req.user.wallet.totalDeposited + amountUsdt),
    lastFundingAt: new Date(),
  };

  req.user.wallet = nextWallet;
  await req.user.save();

  const transaction = await WalletTransaction.create({
    user: req.user._id,
    type: "deposit",
    direction: "credit",
    method,
    status: "completed",
    referenceId: generateReferenceId("DEP"),
    amountInr,
    amountUsdt,
    balanceAfter: nextWallet.marginBalance,
    note: metadata.note,
    counterparty: metadata.accountHolderName,
    bankReference: metadata.bankReference || "",
    upiId: metadata.upiId || "",
    cardLast4: metadata.cardLast4 || "",
  });

  res.status(201).json({
    message: `${methodLabels[method]} deposit completed. ${amountUsdt.toFixed(2)} USDT credited to your wallet.`,
    transaction: formatWalletTransaction(transaction),
    ...(await loadWalletResponse(req.user)),
  });
});

module.exports = {
  getWalletOverview,
  createDeposit,
};
