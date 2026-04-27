const { connectDatabase } = require("../config/db");
const mongoose = require("mongoose");
const Trader = require("../models/Trader");
const Trade = require("../models/Trade");
const sampleTraders = require("./sampleTraders");

const tradeSignature = (trade) =>
  `${trade.instrument}::${new Date(trade.openTime).toISOString()}`;

const seedDatabase = async () => {
  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }

  for (const item of sampleTraders) {
    const { trades, ...traderPayload } = item;
    let trader = await Trader.findOne({ name: traderPayload.name });

    if (!trader) {
      trader = await Trader.create(traderPayload);
    }

    const existingTrades = await Trade.find({ trader: trader._id })
      .select("instrument openTime")
      .lean();
    const existingTradeKeys = new Set(existingTrades.map(tradeSignature));
    const tradePayload = trades
      .filter((trade) => !existingTradeKeys.has(tradeSignature(trade)))
      .map((trade) => ({
        ...trade,
        trader: trader._id,
      }));

    if (tradePayload.length > 0) {
      await Trade.insertMany(tradePayload);
    }

    const totalTradeCount = await Trade.countDocuments({ trader: trader._id });
    const currentTotalPositions = trader.performance?.totalPositions || 0;

    if (totalTradeCount > currentTotalPositions) {
      trader.performance.totalPositions = totalTradeCount;
      await trader.save();
    }
  }

  console.log("TradeReplica sample traders synced");
};

if (require.main === module) {
  seedDatabase()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close();
    });
}

module.exports = {
  seedDatabase,
};
