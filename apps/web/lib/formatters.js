export const currency = (value, currencyCode = "USD") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const number = (value, digits = 2) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(Number(value || 0));

export const compact = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

export const formatPercentage = (value) => `${number(value, 2)}%`;

export const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export const statusTone = (status) => {
  if (status === "online") {
    return "bg-emerald-400";
  }

  if (status === "away") {
    return "bg-amber-400";
  }

  return "bg-slate-400";
};

