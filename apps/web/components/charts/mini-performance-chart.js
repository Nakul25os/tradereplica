"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { enhancePerformanceSeries } from "@/lib/chart-series";

export default function MiniPerformanceChart({ data = [], trader }) {
  const series = enhancePerformanceSeries(data, trader);
  const gradientId = `mini-graph-${String(trader?.id || trader?.name || "trader")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()}`;

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.34} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Tooltip
            formatter={(value) => [`${Number(value || 0).toFixed(2)}%`, "ROI"]}
            labelFormatter={(label) => label}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.24)",
              borderRadius: 16,
            }}
            labelStyle={{ color: "#cbd5e1" }}
          />
          <Area
            type="monotone"
            dataKey="roi"
            stroke="#22c55e"
            strokeWidth={2.8}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: "#38bdf8" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
