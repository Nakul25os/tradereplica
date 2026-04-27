const asyncHandler = require("../utils/asyncHandler");
const Trader = require("../models/Trader");
const { buildWalletSnapshot, ensureWalletState } = require("../utils/wallet");

const summaryProjection = "name portfolioName marketType dailyPick performance.pnl30d performance.roi30d";

const getDashboardSummary = asyncHandler(async (req, res) => {
  const { changed } = ensureWalletState(req.user);

  if (changed) {
    await req.user.save();
  }

  const [topTraders, dailyPicks, favoriteCount] = await Promise.all([
    Trader.find()
      .select(summaryProjection)
      .sort({ "performance.pnl30d": -1 })
      .limit(3)
      .lean(),
    Trader.find({ dailyPick: true })
      .select(summaryProjection)
      .sort({ "performance.roi30d": -1 })
      .limit(2)
      .lean(),
    Promise.resolve(req.user.favorites.length),
  ]);
  const wallet = buildWalletSnapshot(req.user.wallet);

  res.json({
    marginBalance: wallet.marginBalance,
    availableBalance: wallet.availableBalance,
    copyLockedBalance: wallet.copyLockedBalance,
    totalDeposited: wallet.totalDeposited,
    unrealizedPnl: wallet.unrealizedPnl,
    lastFundingAt: wallet.lastFundingAt,
    fxRateInrPerUsdt: wallet.fxRateInrPerUsdt,
    copyOverview: {
      activeCopies: req.user.copiedPortfolios.length,
      favoriteCount,
    },
    topTraders: topTraders.map((trader) => ({
      id: trader._id,
      name: trader.name,
      portfolioName: trader.portfolioName,
      roi30d: trader.performance.roi30d,
      pnl30d: trader.performance.pnl30d,
    })),
    dailyPicks: dailyPicks.map((trader) => ({
      id: trader._id,
      name: trader.name,
      marketType: trader.marketType,
      roi30d: trader.performance.roi30d,
    })),
  });
});

module.exports = {
  getDashboardSummary,
};
