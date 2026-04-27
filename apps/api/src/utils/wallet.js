const env = require("../config/env");

const roundMoney = (value, digits = 2) =>
  Number(Number(value || 0).toFixed(digits));

const normalizeWallet = (wallet = {}) => {
  const marginBalance = roundMoney(wallet.marginBalance);
  const availableBalance =
    wallet.availableBalance === undefined || wallet.availableBalance === null
      ? marginBalance
      : roundMoney(wallet.availableBalance);
  const copyLockedBalance =
    wallet.copyLockedBalance === undefined || wallet.copyLockedBalance === null
      ? roundMoney(Math.max(marginBalance - availableBalance, 0))
      : roundMoney(wallet.copyLockedBalance);
  const totalDeposited =
    wallet.totalDeposited === undefined || wallet.totalDeposited === null
      ? roundMoney(marginBalance)
      : roundMoney(wallet.totalDeposited);
  const unrealizedPnl = roundMoney(wallet.unrealizedPnl);
  const normalizedMarginBalance = roundMoney(
    Math.max(marginBalance, availableBalance + copyLockedBalance)
  );

  return {
    marginBalance: normalizedMarginBalance,
    availableBalance,
    copyLockedBalance,
    totalDeposited,
    unrealizedPnl,
    lastFundingAt: wallet.lastFundingAt || null,
  };
};

const ensureWalletState = (user) => {
  const normalizedWallet = normalizeWallet(user.wallet);
  const currentWallet = user.wallet || {};
  const changed =
    roundMoney(currentWallet.marginBalance) !== normalizedWallet.marginBalance ||
    roundMoney(currentWallet.availableBalance) !==
      normalizedWallet.availableBalance ||
    roundMoney(currentWallet.copyLockedBalance) !==
      normalizedWallet.copyLockedBalance ||
    roundMoney(currentWallet.totalDeposited) !==
      normalizedWallet.totalDeposited ||
    roundMoney(currentWallet.unrealizedPnl) !==
      normalizedWallet.unrealizedPnl ||
    String(currentWallet.lastFundingAt || "") !==
      String(normalizedWallet.lastFundingAt || "");

  if (changed) {
    user.wallet = normalizedWallet;
  }

  return {
    wallet: changed ? normalizedWallet : normalizeWallet(currentWallet),
    changed,
  };
};

const convertInrToUsdt = (amountInr) =>
  roundMoney(Number(amountInr || 0) / env.inrPerUsdt);

const convertUsdtToInr = (amountUsdt) =>
  roundMoney(Number(amountUsdt || 0) * env.inrPerUsdt);

const buildWalletSnapshot = (wallet) => ({
  ...normalizeWallet(wallet),
  fxRateInrPerUsdt: env.inrPerUsdt,
});

module.exports = {
  roundMoney,
  normalizeWallet,
  ensureWalletState,
  convertInrToUsdt,
  convertUsdtToInr,
  buildWalletSnapshot,
};
