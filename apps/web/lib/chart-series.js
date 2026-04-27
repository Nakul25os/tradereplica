const marketVolatility = {
  "Indian Stock Market": 1.14,
  "Forex Market": 0.92,
  "Crypto Market": 1.48,
};

export const chartTypeOptions = [
  { id: "bars", label: "Bars" },
  { id: "candles", label: "Candles" },
  { id: "hollow-candles", label: "Hollow Candles" },
  { id: "columns", label: "Columns" },
  { id: "line", label: "Line" },
  { id: "area", label: "Area" },
  { id: "baseline", label: "Baseline" },
  { id: "high-low", label: "High-Low" },
  { id: "heikin-ashi", label: "Heikin Ashi" },
  { id: "renko", label: "Renko" },
  { id: "line-break", label: "Line Break" },
  { id: "kagi", label: "Kagi" },
  { id: "point-figure", label: "Point & Figure" },
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const lerp = (start, end, amount) => start + (end - start) * amount;

const parseDay = (label, index, total) => {
  const match = String(label || "").match(/(\d+)/);

  if (match) {
    return Number(match[1]);
  }

  return Math.max(1, Math.round(((index + 1) / Math.max(total, 1)) * 30));
};

const hashString = (input = "") => {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
};

const formatDayLabel = (day) => `Day ${Math.round(day)}`;

const buildMetricCandles = (series, key, seed, volatility) =>
  series.map((point, index) => {
    const previous = series[index - 1] || point;
    const next = series[index + 1] || point;
    const currentClose = point[key];
    const previousClose = previous[key];
    const nextClose = next[key];
    const noise = (((seed + index * 53) % 100) / 100) - 0.5;
    const movement = currentClose - previousClose;
    const nextMovement = nextClose - currentClose;
    const open =
      index === 0
        ? currentClose - (nextClose - currentClose) * 0.28
        : previousClose + noise * Math.max(Math.abs(movement) * 0.2, volatility);
    const wickBase =
      key === "roi"
        ? Math.max(0.16, Math.abs(currentClose - open) * 0.48 + Math.abs(nextMovement) * 0.24 + volatility * 0.9)
        : Math.max(
            55,
            Math.abs(currentClose - open) * 0.38 +
              Math.abs(nextMovement) * 0.28 +
              Math.max(Math.abs(currentClose) * 0.02, volatility * 180)
          );
    const wickHigh = wickBase * (0.66 + (((seed + index * 11) % 5) * 0.05));
    const wickLow = wickBase * (0.54 + (((seed + index * 7) % 4) * 0.06));
    const high = Math.max(open, currentClose) + wickHigh;
    const low = Math.min(open, currentClose) - wickLow;

    return {
      ...point,
      [`${key}Open`]: open,
      [`${key}High`]: high,
      [`${key}Low`]: low,
      [`${key}Close`]: currentClose,
    };
  });

export const getMetricSnapshot = (point, metric) => ({
  open: point?.[`${metric}Open`] ?? point?.[metric] ?? 0,
  high: point?.[`${metric}High`] ?? point?.[metric] ?? 0,
  low: point?.[`${metric}Low`] ?? point?.[metric] ?? 0,
  close: point?.[`${metric}Close`] ?? point?.[metric] ?? 0,
  value: point?.[metric] ?? 0,
});

export const buildHeikinAshiSeries = (series, metric) => {
  let previousOpen = null;
  let previousClose = null;

  return series.map((point, index) => {
    const snapshot = getMetricSnapshot(point, metric);
    const close =
      (snapshot.open + snapshot.high + snapshot.low + snapshot.close) / 4;
    const open =
      index === 0
        ? (snapshot.open + snapshot.close) / 2
        : (previousOpen + previousClose) / 2;
    const high = Math.max(snapshot.high, open, close);
    const low = Math.min(snapshot.low, open, close);

    previousOpen = open;
    previousClose = close;

    return {
      ...point,
      [`${metric}Open`]: open,
      [`${metric}High`]: high,
      [`${metric}Low`]: low,
      [`${metric}Close`]: close,
      [metric]: close,
    };
  });
};

export const buildRenkoBricks = (series, metric) => {
  if (series.length === 0) {
    return [];
  }

  const closes = series.map((point) => getMetricSnapshot(point, metric).close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const boxSize = Math.max((max - min) / 12, metric === "roi" ? 0.42 : 120);
  const bricks = [];
  let anchor = closes[0];

  closes.forEach((close) => {
    while (close >= anchor + boxSize) {
      bricks.push({
        direction: "up",
        open: anchor,
        close: anchor + boxSize,
      });
      anchor += boxSize;
    }

    while (close <= anchor - boxSize) {
      bricks.push({
        direction: "down",
        open: anchor,
        close: anchor - boxSize,
      });
      anchor -= boxSize;
    }
  });

  if (bricks.length === 0) {
    bricks.push({
      direction: "up",
      open: closes[0] - boxSize / 2,
      close: closes[0] + boxSize / 2,
    });
  }

  return bricks.slice(-24);
};

export const buildPointFigureColumns = (series, metric) => {
  const closes = series.map((point) => getMetricSnapshot(point, metric).close);

  if (closes.length < 2) {
    return [];
  }

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const boxSize = Math.max((max - min) / 10, metric === "roi" ? 0.48 : 140);
  const columns = [];
  let currentColumn = {
    type: closes[1] >= closes[0] ? "X" : "O",
    boxes: [closes[0]],
  };

  closes.slice(1).forEach((close) => {
    const lastValue =
      currentColumn.boxes[currentColumn.boxes.length - 1] ?? close;
    const delta = close - lastValue;

    if (currentColumn.type === "X") {
      if (delta >= boxSize) {
        currentColumn.boxes.push(close);
      } else if (delta <= -boxSize * 2) {
        columns.push(currentColumn);
        currentColumn = {
          type: "O",
          boxes: [lastValue - boxSize, close],
        };
      }
    } else if (delta <= -boxSize) {
      currentColumn.boxes.push(close);
    } else if (delta >= boxSize * 2) {
      columns.push(currentColumn);
      currentColumn = {
        type: "X",
        boxes: [lastValue + boxSize, close],
      };
    }
  });

  columns.push(currentColumn);

  return columns.slice(-14);
};

export const enhancePerformanceSeries = (timeline = [], trader = {}) => {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return [];
  }

  const sortedTimeline = [...timeline]
    .map((point, index, points) => ({
      day: parseDay(point.label, index, points.length),
      label: point.label,
      roi: Number(point.roi || 0),
      pnl: Number(point.pnl || 0),
    }))
    .sort((left, right) => left.day - right.day);
  const performance = trader.performance || {};
  const mdd = Number(performance.mdd || 5);
  const sharpeRatio = Number(performance.sharpeRatio || 2);
  const seed = hashString(
    `${trader.id || trader.name || "trader"}:${trader.marketType || ""}:${performance.roi30d || 0}`
  );
  const marketFactor = marketVolatility[trader.marketType] || 1.08;
  const volatility =
    marketFactor * (0.26 + mdd / 16 + ((seed % 13) / 24) + Math.max(0, 2.7 - sharpeRatio) / 7);
  const expanded = [sortedTimeline[0]];

  for (let index = 0; index < sortedTimeline.length - 1; index += 1) {
    const start = sortedTimeline[index];
    const end = sortedTimeline[index + 1];
    const directionBias = ((seed >> (index % 8)) & 1) === 0 ? -1 : 1;

    for (let step = 1; step <= 3; step += 1) {
      const progress = step / 3;
      const day = lerp(start.day, end.day, progress);
      const waveEnvelope = progress === 1 ? 0 : Math.sin(Math.PI * progress);
      const phase = seed * 0.013 + index * 1.47 + progress * 4.2;
      const roiBase = lerp(start.roi, end.roi, progress);
      const pnlBase = lerp(start.pnl, end.pnl, progress);
      const roiDrift = Math.abs(end.roi - start.roi);
      const pnlDrift = Math.abs(end.pnl - start.pnl);
      const roiAmplitude =
        roiDrift * 0.24 + volatility * 0.82 + Math.max(0, 3 - sharpeRatio) * 0.12;
      const pnlAmplitude = Math.max(
        pnlDrift * 0.22,
        Math.abs(pnlBase) * 0.032 + volatility * 145
      );
      const roiSwing =
        waveEnvelope *
        (Math.sin(phase) * roiAmplitude * 0.72 +
          Math.cos(phase * 0.63) * roiAmplitude * 0.26 -
          directionBias * volatility * 0.16);
      const pnlSwing =
        waveEnvelope *
        (Math.sin(phase * 0.92) * pnlAmplitude * 0.8 +
          Math.cos(phase * 0.48) * pnlAmplitude * 0.22 -
          directionBias * pnlAmplitude * 0.08);

      expanded.push({
        day,
        label: formatDayLabel(day),
        roi: progress === 1 ? end.roi : roiBase + roiSwing,
        pnl: progress === 1 ? end.pnl : pnlBase + pnlSwing,
      });
    }
  }

  const withLabels = expanded.map((point, index) => ({
    ...point,
    shortLabel:
      index % 3 === 0 || index === expanded.length - 1
        ? `D${Math.round(point.day)}`
        : "",
    volume: Math.round(
      Math.abs(point.pnl) * 0.16 + 220 + ((seed + index * 29) % 580)
    ),
  }));
  const withRoiCandles = buildMetricCandles(withLabels, "roi", seed, volatility);

  return buildMetricCandles(withRoiCandles, "pnl", seed + 17, volatility * 130).map(
    (point) => ({
      ...point,
      direction:
        point.roiClose >= point.roiOpen
          ? "up"
          : "down",
      roiDelta: point.roiClose - point.roiOpen,
      pnlDelta: point.pnlClose - point.pnlOpen,
      normalizedDay: clamp(point.day / 30, 0, 1),
    })
  );
};
