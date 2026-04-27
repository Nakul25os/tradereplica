export const COMPARE_STORAGE_KEY = "tradereplica_compare";

export const readCompareSelection = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(COMPARE_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

export const writeCompareSelection = (selection) => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(
    COMPARE_STORAGE_KEY,
    JSON.stringify(selection || [])
  );
};

export const upsertCompareSelection = (trader) => {
  const current = readCompareSelection();
  const existingIndex = current.findIndex((item) => item.id === trader.id);

  if (existingIndex >= 0) {
    current[existingIndex] = trader;
    writeCompareSelection(current);
    return current;
  }

  const nextSelection = [...current.slice(-1), trader];
  writeCompareSelection(nextSelection);
  return nextSelection;
};

