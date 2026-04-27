const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");
const Trader = require("../models/Trader");
const Trade = require("../models/Trade");
const WalletTransaction = require("../models/WalletTransaction");
const { formatTraderCard, formatTraderDetails } = require("../utils/traderTransformers");
const { convertUsdtToInr, ensureWalletState, roundMoney } = require("../utils/wallet");

const traderListProjection = [
  "name",
  "portfolioName",
  "note",
  "marketType",
  "location",
  "status",
  "dailyPick",
  "followers",
  "performance",
  "overview",
].join(" ");

const buildTraderQuery = (query) => {
  const filters = {};

  if (query.search) {
    filters.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { portfolioName: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.marketType && query.marketType !== "All Markets") {
    filters.marketType = query.marketType;
  }

  if (query.dailyPick === "true") {
    filters.dailyPick = true;
  }

  return filters;
};

const getTraders = asyncHandler(async (req, res) => {
  const filters = buildTraderQuery(req.query);
  let traders = await Trader.find(filters)
    .select(traderListProjection)
    .sort({
      "performance.pnl30d": -1,
    })
    .lean();

  if (req.query.onlyFavorites === "true") {
    if (!req.user) {
      throw new HttpError(401, "Login required to view favorites.");
    }

    const favoriteIds = req.user.favorites.map((item) => item.toString());
    traders = traders.filter((trader) => favoriteIds.includes(trader._id.toString()));
  }

  if (req.query.smart === "true") {
    traders = traders.filter(
      (trader) =>
        trader.performance.sharpeRatio >= 2 && trader.performance.mdd <= 7
    );
  }

  if (req.query.minPnl) {
    const minPnl = Number(req.query.minPnl);

    if (Number.isFinite(minPnl)) {
      traders = traders.filter((trader) => trader.performance.pnl30d >= minPnl);
    }
  }

  const response = traders.map((trader) => formatTraderCard(trader, req.user));

  res.json({
    traders: response,
    dailyPicks: response.filter((trader) => trader.dailyPick),
    filters: {
      timeFilter: req.query.timeFilter || "30 Days",
      smart: req.query.smart === "true",
      marketType: req.query.marketType || "All Markets",
    },
  });
});

const getTraderById = asyncHandler(async (req, res) => {
  const trader = await Trader.findById(req.params.id).lean();

  if (!trader) {
    throw new HttpError(404, "Trader not found.");
  }

  const trades = await Trade.find({ trader: trader._id })
    .sort({
      openTime: req.query.order === "asc" ? 1 : -1,
    })
    .lean();

  res.json({
    trader: formatTraderDetails(trader, trades, req.user),
  });
});

const toggleFavorite = asyncHandler(async (req, res) => {
  const trader = await Trader.findById(req.params.id);

  if (!trader) {
    throw new HttpError(404, "Trader not found.");
  }

  const existingIndex = req.user.favorites.findIndex(
    (item) => item.toString() === trader._id.toString()
  );

  if (existingIndex >= 0) {
    req.user.favorites.splice(existingIndex, 1);
  } else {
    req.user.favorites.push(trader._id);
  }

  await req.user.save();

  res.json({
    message:
      existingIndex >= 0
        ? "Removed from favorites."
        : "Added to favorites.",
    favorites: req.user.favorites,
  });
});

const copyTrader = asyncHandler(async (req, res) => {
  const trader = await Trader.findById(req.params.id);

  if (!trader) {
    throw new HttpError(404, "Trader not found.");
  }

  const mode = req.body.mode === "live" ? "live" : "mock";
  const amount = Number(req.body.amount || trader.overview.minimumCopyAmount || 250);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new HttpError(400, "Copy amount must be greater than zero.");
  }

  const alreadyCopying = req.user.copiedPortfolios.find(
    (item) =>
      item.trader.toString() === trader._id.toString() && item.mode === mode
  );

  if (alreadyCopying) {
    throw new HttpError(409, `You are already ${mode} copying this trader.`);
  }

  if (mode === "live" && trader.followers.current >= trader.followers.max) {
    throw new HttpError(409, "Trader capacity is full for live copy.");
  }

  ensureWalletState(req.user);

  if (mode === "live" && req.user.wallet.availableBalance < amount) {
    throw new HttpError(
      400,
      `Insufficient available balance. Deposit at least ${roundMoney(amount - req.user.wallet.availableBalance).toFixed(2)} USDT more or lower the copy amount.`
    );
  }

  req.user.copiedPortfolios.push({
    trader: trader._id,
    mode,
    amount,
    startedAt: new Date(),
  });
  trader.copyTraders.unshift({
    alias: req.user.username,
    mode,
    amount,
    startedAt: new Date(),
  });

  if (trader.copyTraders.length > 24) {
    trader.copyTraders = trader.copyTraders.slice(0, 24);
  }

  if (mode === "live") {
    trader.followers.current += 1;
    trader.followers.total += 1;
    req.user.wallet.availableBalance = roundMoney(
      req.user.wallet.availableBalance - amount
    );
    req.user.wallet.copyLockedBalance = roundMoney(
      req.user.wallet.copyLockedBalance + amount
    );
    req.user.wallet.marginBalance = roundMoney(
      req.user.wallet.availableBalance + req.user.wallet.copyLockedBalance
    );
  } else {
    trader.followers.mock += 1;
  }

  await Promise.all([req.user.save(), trader.save()]);

  if (mode === "live") {
    await WalletTransaction.create({
      user: req.user._id,
      type: "copy_allocation",
      direction: "debit",
      method: "copy_live",
      status: "completed",
      referenceId: `CPY-${Date.now()}-${trader._id.toString().slice(-6).toUpperCase()}`,
      amountInr: convertUsdtToInr(amount),
      amountUsdt: roundMoney(amount),
      balanceAfter: req.user.wallet.marginBalance,
      note: `Live allocation locked for ${trader.portfolioName}.`,
      counterparty: req.user.username,
      trader: trader._id,
      traderName: trader.name,
      marketType: trader.marketType,
    });
  }

  res.json({
    message:
      mode === "live"
        ? "Live copy started successfully."
        : "Mock copy started successfully.",
    copiedPortfolio: {
      traderId: trader._id,
      mode,
      amount,
    },
    wallet: req.user.wallet,
  });
});

module.exports = {
  getTraders,
  getTraderById,
  toggleFavorite,
  copyTrader,
};
