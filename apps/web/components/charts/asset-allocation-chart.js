"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#22c55e", "#38bdf8", "#f59e0b", "#64748b", "#f97316"];

export default function AssetAllocationChart({ data = [] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-center">
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="allocation"
              nameKey="asset"
              innerRadius={72}
              outerRadius={104}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell key={entry.asset} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid rgba(148, 163, 184, 0.24)",
                borderRadius: 16,
              }}
              labelStyle={{ color: "#cbd5e1" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid gap-3">
        {data.map((entry, index) => (
          <div key={entry.asset} className="soft-panel flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="font-medium">{entry.asset}</span>
            </div>
            <span className="font-semibold text-emerald-400">
              {entry.allocation}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

