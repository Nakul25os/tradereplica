const methodLabels = {
  bank_transfer: "Bank Transfer",
  upi_qr: "UPI / QR",
  card: "Card Funding",
  copy_live: "Live Copy Allocation",
};

const typeLabels = {
  deposit: "Deposit",
  copy_allocation: "Copy Allocation",
};

const formatWalletTransaction = (transaction) => ({
  id: transaction._id,
  referenceId: transaction.referenceId,
  type: transaction.type,
  typeLabel: typeLabels[transaction.type] || transaction.type,
  direction: transaction.direction,
  method: transaction.method,
  methodLabel: methodLabels[transaction.method] || transaction.method,
  status: transaction.status,
  amountInr: transaction.amountInr,
  amountUsdt: transaction.amountUsdt,
  balanceAfter: transaction.balanceAfter,
  note: transaction.note,
  counterparty: transaction.counterparty,
  bankReference: transaction.bankReference,
  upiId: transaction.upiId,
  cardLast4: transaction.cardLast4,
  traderId: transaction.trader,
  traderName: transaction.traderName,
  marketType: transaction.marketType,
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

module.exports = {
  formatWalletTransaction,
  methodLabels,
};
