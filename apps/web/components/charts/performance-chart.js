"use client";

import {
  buildHeikinAshiSeries,
  buildPointFigureColumns,
  buildRenkoBricks,
  enhancePerformanceSeries,
  getMetricSnapshot,
} from "@/lib/chart-series";

const chartStroke = {
  roi: "#22c55e",
  pnl: "#38bdf8",
};

const chartAccent = {
  up: "#22c55e",
  down: "#fb7185",
};

const chartFrame = {
  width: 960,
  height: 360,
  paddingTop: 20,
  paddingRight: 22,
  paddingBottom: 34,
  paddingLeft: 52,
};

export default function PerformanceChart({
  data = [],
  metric = "roi",
  chartType = "area",
  trader,
}) {
  const baseSeries = enhancePerformanceSeries(data, trader);

  if (baseSeries.length === 0) {
    return (
      <div className="flex h-[340px] items-center justify-center rounded-3xl border border-[var(--border)] bg-white/5 text-sm text-[var(--foreground)]/70">
        Performance data is not available for this portfolio.
      </div>
    );
  }

  const displaySeries =
    chartType === "heikin-ashi"
      ? buildHeikinAshiSeries(baseSeries, metric)
      : baseSeries;
  const plotWidth =
    chartFrame.width - chartFrame.paddingLeft - chartFrame.paddingRight;
  const plotHeight =
    chartFrame.height - chartFrame.paddingTop - chartFrame.paddingBottom;
  const values = displaySeries.flatMap((point) => {
    const snapshot = getMetricSnapshot(point, metric);
    return [snapshot.open, snapshot.high, snapshot.low, snapshot.close];
  });
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, metric === "roi" ? 1 : 200);
  const paddedMin = minValue - spread * 0.14;
  const paddedMax = maxValue + spread * 0.14;
  const valueRange = Math.max(paddedMax - paddedMin, metric === "roi" ? 1 : 200);
  const pointWidth = plotWidth / Math.max(displaySeries.length - 1, 1);
  const valueFormatter = (value) =>
    metric === "roi"
      ? `${Number(value || 0).toFixed(2)}%`
      : new Intl.NumberFormat("en-IN", {
          notation: "compact",
          maximumFractionDigits: 2,
        }).format(Number(value || 0));
  const mapX = (index, count = displaySeries.length) =>
    chartFrame.paddingLeft +
    (index / Math.max(count - 1, 1)) * plotWidth;
  const mapY = (value) =>
    chartFrame.height -
    chartFrame.paddingBottom -
    ((value - paddedMin) / valueRange) * plotHeight;
  const closePoints = displaySeries.map((point, index) => ({
    x: mapX(index),
    y: mapY(getMetricSnapshot(point, metric).close),
    value: getMetricSnapshot(point, metric).close,
    point,
  }));
  const fillId = `tradeReplica-${metric}-${chartType}`;

  return (
    <div className="relative h-[340px] w-full overflow-hidden rounded-3xl border border-[var(--border)] bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,rgba(8,18,38,0.95),rgba(6,15,31,0.98))]">
      <svg
        viewBox={`0 0 ${chartFrame.width} ${chartFrame.height}`}
        className="h-full w-full"
        role="img"
        aria-label={`${metric.toUpperCase()} ${chartType} chart`}
      >
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartStroke[metric]} stopOpacity="0.34" />
            <stop offset="100%" stopColor={chartStroke[metric]} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`${fillId}-baseline`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="0.08" />
            <stop offset="51%" stopColor="#fb7185" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.24" />
          </linearGradient>
        </defs>

        {buildGridLines(mapY, valueRange, paddedMin, valueFormatter)}
        {renderChartBody({
          chartType,
          closePoints,
          displaySeries,
          metric,
          mapX,
          mapY,
          pointWidth,
          plotBottom: chartFrame.height - chartFrame.paddingBottom,
          fillId,
        })}
        {buildAxes({
          closePoints,
          displaySeries,
          valueRange,
          paddedMin,
          mapY,
          valueFormatter,
        })}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/5 bg-slate-950/55 px-4 py-3 text-xs">
        <span className="text-[var(--foreground)]/62">
          {chartTypeLabel(chartType)} view
        </span>
        <span className="font-semibold text-[var(--foreground)]/76">
          Last {metric.toUpperCase()}:{" "}
          <span className="text-emerald-300">
            {valueFormatter(closePoints[closePoints.length - 1]?.value)}
          </span>
        </span>
      </div>
    </div>
  );
}

function renderChartBody({
  chartType,
  closePoints,
  displaySeries,
  metric,
  mapX,
  mapY,
  pointWidth,
  plotBottom,
  fillId,
}) {
  if (chartType === "line") {
    return renderLine(closePoints, metric);
  }

  if (chartType === "area") {
    return renderArea(closePoints, metric, fillId, plotBottom);
  }

  if (chartType === "columns") {
    return renderColumns(displaySeries, metric, mapX, mapY, pointWidth, plotBottom);
  }

  if (chartType === "baseline") {
    return renderBaseline(closePoints, metric, fillId, plotBottom, mapY);
  }

  if (chartType === "high-low") {
    return renderHighLow(displaySeries, metric, mapX, mapY);
  }

  if (chartType === "bars") {
    return renderOhlcBars(displaySeries, metric, mapX, mapY, pointWidth);
  }

  if (chartType === "candles") {
    return renderCandles(displaySeries, metric, mapX, mapY, pointWidth, false);
  }

  if (chartType === "hollow-candles" || chartType === "heikin-ashi") {
    return renderCandles(displaySeries, metric, mapX, mapY, pointWidth, true);
  }

  if (chartType === "renko") {
    return renderRenko(displaySeries, metric, mapY, plotBottom);
  }

  if (chartType === "line-break") {
    return renderLineBreak(closePoints, metric);
  }

  if (chartType === "kagi") {
    return renderKagi(closePoints, metric);
  }

  if (chartType === "point-figure") {
    return renderPointFigure(displaySeries, metric, mapY, plotBottom);
  }

  return renderArea(closePoints, metric, fillId, plotBottom);
}

function renderLine(points, metric) {
  return (
    <g>
      <path
        d={buildLinePath(points)}
        fill="none"
        stroke={chartStroke[metric]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {renderLatestPoint(points, metric)}
    </g>
  );
}

function renderArea(points, metric, fillId, plotBottom) {
  return (
    <g>
      <path d={buildAreaPath(points, plotBottom)} fill={`url(#${fillId})`} />
      <path
        d={buildLinePath(points)}
        fill="none"
        stroke={chartStroke[metric]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {renderLatestPoint(points, metric)}
    </g>
  );
}

function renderColumns(series, metric, mapX, mapY, pointWidth, plotBottom) {
  const barWidth = Math.max(pointWidth * 0.48, 12);

  return (
    <g>
      {series.map((point, index) => {
        const snapshot = getMetricSnapshot(point, metric);
        const x = mapX(index) - barWidth / 2;
        const y = mapY(snapshot.close);
        const height = Math.max(plotBottom - y, 3);

        return (
          <rect
            key={`${point.label}-${index}`}
            x={x}
            y={y}
            width={barWidth}
            height={height}
            rx="4"
            fill={snapshot.close >= snapshot.open ? "rgba(34,197,94,0.82)" : "rgba(248,113,113,0.82)"}
          />
        );
      })}
    </g>
  );
}

function renderBaseline(points, metric, fillId, plotBottom, mapY) {
  const baselineY = mapY(points[0]?.value || 0);

  return (
    <g>
      <path d={buildAreaPath(points, plotBottom)} fill={`url(#${fillId}-baseline)`} />
      <path
        d={buildLinePath(points)}
        fill="none"
        stroke={chartStroke[metric]}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1={points[0]?.x || 0}
        y1={baselineY}
        x2={points[points.length - 1]?.x || 0}
        y2={baselineY}
        stroke="rgba(148,163,184,0.55)"
        strokeDasharray="6 6"
      />
      {renderLatestPoint(points, metric)}
    </g>
  );
}

function renderHighLow(series, metric, mapX, mapY) {
  return (
    <g>
      {series.map((point, index) => {
        const snapshot = getMetricSnapshot(point, metric);
        const x = mapX(index);

        return (
          <g key={`${point.label}-${index}`}>
            <line
              x1={x}
              y1={mapY(snapshot.high)}
              x2={x}
              y2={mapY(snapshot.low)}
              stroke={snapshot.close >= snapshot.open ? chartAccent.up : chartAccent.down}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx={x}
              cy={mapY(snapshot.close)}
              r="3.1"
              fill={snapshot.close >= snapshot.open ? chartAccent.up : chartAccent.down}
            />
          </g>
        );
      })}
    </g>
  );
}

function renderOhlcBars(series, metric, mapX, mapY, pointWidth) {
  const tickWidth = Math.max(pointWidth * 0.24, 5);

  return (
    <g>
      {series.map((point, index) => {
        const snapshot = getMetricSnapshot(point, metric);
        const x = mapX(index);
        const tone = snapshot.close >= snapshot.open ? chartAccent.up : chartAccent.down;

        return (
          <g key={`${point.label}-${index}`}>
            <line
              x1={x}
              y1={mapY(snapshot.high)}
              x2={x}
              y2={mapY(snapshot.low)}
              stroke={tone}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={x - tickWidth}
              y1={mapY(snapshot.open)}
              x2={x}
              y2={mapY(snapshot.open)}
              stroke={tone}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1={x}
              y1={mapY(snapshot.close)}
              x2={x + tickWidth}
              y2={mapY(snapshot.close)}
              stroke={tone}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </g>
  );
}

function renderCandles(series, metric, mapX, mapY, pointWidth, hollowUp) {
  const candleWidth = Math.max(pointWidth * 0.42, 10);

  return (
    <g>
      {series.map((point, index) => {
        const snapshot = getMetricSnapshot(point, metric);
        const x = mapX(index);
        const openY = mapY(snapshot.open);
        const closeY = mapY(snapshot.close);
        const highY = mapY(snapshot.high);
        const lowY = mapY(snapshot.low);
        const y = Math.min(openY, closeY);
        const height = Math.max(Math.abs(openY - closeY), 3);
        const bullish = snapshot.close >= snapshot.open;

        return (
          <g key={`${point.label}-${index}`}>
            <line
              x1={x}
              y1={highY}
              x2={x}
              y2={lowY}
              stroke={bullish ? chartAccent.up : chartAccent.down}
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <rect
              x={x - candleWidth / 2}
              y={y}
              width={candleWidth}
              height={height}
              rx="3"
              fill={
                hollowUp && bullish
                  ? "transparent"
                  : bullish
                    ? "rgba(34,197,94,0.72)"
                    : "rgba(248,113,113,0.78)"
              }
              stroke={bullish ? chartAccent.up : chartAccent.down}
              strokeWidth="1.8"
            />
          </g>
        );
      })}
    </g>
  );
}

function renderRenko(series, metric, mapY, plotBottom) {
  const bricks = buildRenkoBricks(series, metric);

  if (bricks.length === 0) {
    return null;
  }

  const usableWidth =
    chartFrame.width - chartFrame.paddingLeft - chartFrame.paddingRight;
  const brickWidth = usableWidth / bricks.length;

  return (
    <g>
      {bricks.map((brick, index) => {
        const x = chartFrame.paddingLeft + index * brickWidth + 4;
        const y = mapY(Math.max(brick.open, brick.close));
        const height = Math.max(
          Math.abs(mapY(brick.open) - mapY(brick.close)),
          8
        );

        return (
          <rect
            key={`${brick.direction}-${index}`}
            x={x}
            y={y}
            width={Math.max(brickWidth - 8, 8)}
            height={height}
            rx="4"
            fill={brick.direction === "up" ? "rgba(34,197,94,0.76)" : "rgba(248,113,113,0.76)"}
            stroke={brick.direction === "up" ? chartAccent.up : chartAccent.down}
            strokeWidth="1.6"
          />
        );
      })}
      <line
        x1={chartFrame.paddingLeft}
        y1={plotBottom}
        x2={chartFrame.width - chartFrame.paddingRight}
        y2={plotBottom}
        stroke="rgba(148,163,184,0.15)"
      />
    </g>
  );
}

function renderLineBreak(points, metric) {
  const filtered = reduceTurningPoints(points);

  return (
    <g>
      <path
        d={buildStepPath(filtered)}
        fill="none"
        stroke={chartStroke[metric]}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {renderLatestPoint(points, metric)}
    </g>
  );
}

function renderKagi(points, metric) {
  const filtered = reduceTurningPoints(points);

  return (
    <g>
      <path
        d={buildStepPath(filtered)}
        fill="none"
        stroke={chartStroke[metric]}
        strokeWidth="4.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {filtered.map((point, index) => (
        <circle
          key={`${point.x}-${index}`}
          cx={point.x}
          cy={point.y}
          r="2.6"
          fill={chartAccent.up}
        />
      ))}
    </g>
  );
}

function renderPointFigure(series, metric, mapY, plotBottom) {
  const columns = buildPointFigureColumns(series, metric);

  if (columns.length === 0) {
    return null;
  }

  const usableWidth =
    chartFrame.width - chartFrame.paddingLeft - chartFrame.paddingRight;
  const columnWidth = usableWidth / columns.length;

  return (
    <g>
      {columns.map((column, columnIndex) => (
        <g key={`${column.type}-${columnIndex}`}>
          {column.boxes.map((value, boxIndex) => (
            <text
              key={`${column.type}-${columnIndex}-${boxIndex}`}
              x={chartFrame.paddingLeft + columnWidth * columnIndex + columnWidth / 2}
              y={mapY(value)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={column.type === "X" ? chartAccent.up : chartAccent.down}
              fontSize="15"
              fontWeight="700"
            >
              {column.type}
            </text>
          ))}
        </g>
      ))}
      <line
        x1={chartFrame.paddingLeft}
        y1={plotBottom}
        x2={chartFrame.width - chartFrame.paddingRight}
        y2={plotBottom}
        stroke="rgba(148,163,184,0.14)"
      />
    </g>
  );
}

function buildGridLines(mapY, valueRange, paddedMin, valueFormatter) {
  return Array.from({ length: 5 }).map((_, index) => {
    const value = paddedMin + (valueRange / 4) * index;
    const y = mapY(value);

    return (
      <g key={`grid-${index}`}>
        <line
          x1={chartFrame.paddingLeft}
          y1={y}
          x2={chartFrame.width - chartFrame.paddingRight}
          y2={y}
          stroke="rgba(148,163,184,0.12)"
          strokeDasharray={index === 0 ? "0" : "5 8"}
        />
        <text
          x={12}
          y={y + 4}
          fill="rgba(148,163,184,0.78)"
          fontSize="11"
        >
          {valueFormatter(value)}
        </text>
      </g>
    );
  });
}

function buildAxes({
  closePoints,
  displaySeries,
}) {
  return (
    <g>
      {closePoints.map((point, index) =>
        point.point.shortLabel ? (
          <text
            key={`x-label-${index}`}
            x={point.x}
            y={chartFrame.height - 10}
            fill="rgba(148,163,184,0.78)"
            fontSize="11"
            textAnchor="middle"
          >
            {point.point.shortLabel}
          </text>
        ) : null
      )}

      <text
        x={chartFrame.paddingLeft}
        y={18}
        fill="rgba(229,238,248,0.92)"
        fontSize="12"
        fontWeight="600"
      >
        {displaySeries.length} plotted sessions
      </text>
    </g>
  );
}

function buildLinePath(points) {
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

function buildAreaPath(points, plotBottom) {
  if (points.length === 0) {
    return "";
  }

  const first = points[0];
  const last = points[points.length - 1];

  return `${buildLinePath(points)} L ${last.x.toFixed(2)} ${plotBottom.toFixed(2)} L ${first.x.toFixed(2)} ${plotBottom.toFixed(2)} Z`;
}

function buildStepPath(points) {
  if (points.length === 0) {
    return "";
  }

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index];
    path += ` H ${point.x.toFixed(2)} V ${point.y.toFixed(2)}`;
  }

  return path;
}

function reduceTurningPoints(points) {
  if (points.length <= 3) {
    return points;
  }

  const threshold =
    Math.abs(points[points.length - 1].value - points[0].value) /
      Math.max(points.length - 1, 1) || 1;

  return points.filter((point, index) => {
    if (index === 0 || index === points.length - 1) {
      return true;
    }

    const previous = points[index - 1];
    const next = points[index + 1];
    const incoming = point.value - previous.value;
    const outgoing = next.value - point.value;

    return (
      Math.sign(incoming) !== Math.sign(outgoing) ||
      Math.abs(incoming) > threshold * 1.4 ||
      Math.abs(outgoing) > threshold * 1.4
    );
  });
}

function renderLatestPoint(points, metric) {
  const lastPoint = points[points.length - 1];

  if (!lastPoint) {
    return null;
  }

  return (
    <g>
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="5.5"
        fill={chartStroke[metric]}
        opacity="0.18"
      />
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="3.4"
        fill={chartStroke[metric]}
      />
    </g>
  );
}

function chartTypeLabel(chartType) {
  if (chartType === "heikin-ashi") {
    return "Heikin Ashi";
  }

  if (chartType === "hollow-candles") {
    return "Hollow Candles";
  }

  if (chartType === "high-low") {
    return "High-Low";
  }

  if (chartType === "line-break") {
    return "Line Break";
  }

  if (chartType === "point-figure") {
    return "Point & Figure";
  }

  return chartType
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
