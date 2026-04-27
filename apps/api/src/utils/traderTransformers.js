const formatTrade = (trade) => ({
  id: trade._id,
  marketType: trade.marketType,
  instrument: trade.instrument,
  positionType: trade.positionType,
  status: trade.status,
  openTime: trade.openTime,
  closeTime: trade.closeTime,
  entryPrice: trade.entryPrice,
  exitPrice: trade.exitPrice,
  avgClosePrice: trade.avgClosePrice,
  maxOpenInterest: trade.maxOpenInterest,
  closedVolume: trade.closedVolume,
  pnl: trade.pnl,
});

const formatTraderCard = (trader, user) => {
  const favoriteIds =
    user?.favorites?.map((favorite) => favorite.toString()) || [];
  const copiedPortfolios = user?.copiedPortfolios || [];
  const copiedPortfolioIds =
    copiedPortfolios.map((item) => item.trader.toString()) || [];
  const copyModes = copiedPortfolios.reduce(
    (accumulator, item) => {
      if (item.trader.toString() === trader._id.toString()) {
        accumulator[item.mode] = true;
      }

      return accumulator;
    },
    {
      live: false,
      mock: false,
    }
  );

  return {
    id: trader._id,
    name: trader.name,
    portfolioName: trader.portfolioName,
    note: trader.note,
    translation: trader.translation,
    riskTag: trader.riskTag,
    marketType: trader.marketType,
    location: trader.location,
    status: trader.status,
    profileImage: trader.profileImage,
    dailyPick: trader.dailyPick,
    followers: trader.followers,
    performance: trader.performance,
    overview: trader.overview,
    stats: {
      ...trader.stats,
      totalCopiers: trader.followers.total,
      mockCopiers: trader.followers.mock,
      currentCopiers: trader.followers.current,
      maxCopiers: trader.followers.max,
    },
    assetAllocation: trader.assetAllocation,
    copyTraders: trader.copyTraders,
    isFavorite: favoriteIds.includes(trader._id.toString()),
    isCopied: copiedPortfolioIds.includes(trader._id.toString()),
    copyModes,
    capacityReached: trader.followers.current >= trader.followers.max,
  };
};

const formatTraderDetails = (trader, trades, user) => ({
  ...formatTraderCard(trader, user),
  trades: trades.map(formatTrade),
});

module.exports = {
  formatTrade,
  formatTraderCard,
  formatTraderDetails,
};
