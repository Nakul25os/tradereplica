"use client";

import { useEffect, useState } from "react";
import {
  Baseline,
  Binary,
  BrickWall,
  ChartArea,
  ChartCandlestick,
  ChartColumn,
  ChartLine,
  ChartNoAxesCombined,
  ChartScatter,
  ChartSpline,
  ScanLine,
  SquareChartGantt,
  Star,
} from "lucide-react";
import Button from "@/components/ui/button";
import { chartTypeOptions } from "@/lib/chart-series";

const storageKey = "tradereplica_favorite_chart_types";

const iconMap = {
  bars: ChartNoAxesCombined,
  candles: ChartCandlestick,
  "hollow-candles": ChartCandlestick,
  columns: ChartColumn,
  line: ChartLine,
  area: ChartArea,
  baseline: Baseline,
  "high-low": ChartScatter,
  "heikin-ashi": ChartCandlestick,
  renko: BrickWall,
  "line-break": SquareChartGantt,
  kagi: ChartSpline,
  "point-figure": Binary,
};

export default function ChartTypeSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedFavorites = JSON.parse(
        window.localStorage.getItem(storageKey) || "[]"
      );

      if (Array.isArray(storedFavorites)) {
        setFavoriteIds(storedFavorites);
      }
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  const selectedType =
    chartTypeOptions.find((option) => option.id === value) || chartTypeOptions[5];
  const orderedOptions = [...chartTypeOptions].sort((left, right) => {
    const leftFavorite = favoriteIds.includes(left.id) ? 1 : 0;
    const rightFavorite = favoriteIds.includes(right.id) ? 1 : 0;

    if (leftFavorite !== rightFavorite) {
      return rightFavorite - leftFavorite;
    }

    return chartTypeOptions.findIndex((option) => option.id === left.id) -
      chartTypeOptions.findIndex((option) => option.id === right.id);
  });

  const toggleFavorite = (chartTypeId) => {
    setFavoriteIds((current) => {
      const nextFavorites = current.includes(chartTypeId)
        ? current.filter((item) => item !== chartTypeId)
        : [...current, chartTypeId];

      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(nextFavorites));
      }

      return nextFavorites;
    });
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="min-w-40 justify-between"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="inline-flex items-center gap-2">
          <ScanLine className="h-4 w-4" />
          {selectedType.label}
        </span>
      </Button>

      {open ? (
        <div className="panel-strong absolute right-0 z-30 mt-3 w-[min(92vw,360px)] border p-2 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm font-semibold">Chart Type Filter</p>
              <p className="muted text-xs">Choose how this portfolio graph is displayed.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <div className="mt-2 max-h-[420px] overflow-y-auto">
            {orderedOptions.map((option) => {
              const Icon = iconMap[option.id] || ChartLine;
              const favorite = favoriteIds.includes(option.id);
              const active = option.id === value;

              return (
                <div
                  key={option.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2 transition ${
                    active ? "bg-emerald-500/12" : "hover:bg-white/5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div
                      className={`rounded-2xl p-2 ${
                        active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-white/5 text-[var(--foreground)]/78"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold">{option.label}</p>
                      <p className="muted text-xs">
                        {buildDescription(option.id)}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleFavorite(option.id)}
                    className={`rounded-full p-2 transition ${
                      favorite
                        ? "text-amber-300"
                        : "text-[var(--foreground)]/45 hover:text-[var(--foreground)]/72"
                    }`}
                    aria-label={`Favorite ${option.label}`}
                  >
                    <Star className={`h-4 w-4 ${favorite ? "fill-current" : ""}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildDescription(type) {
  if (type === "candles" || type === "hollow-candles" || type === "heikin-ashi") {
    return "OHLC-style price movement with intraday-like structure.";
  }

  if (type === "renko" || type === "point-figure" || type === "line-break") {
    return "Structure-first view for trend confirmation and reversals.";
  }

  if (type === "high-low" || type === "bars") {
    return "Range-focused display for volatility and session expansion.";
  }

  if (type === "baseline") {
    return "Performance relative to a starting reference level.";
  }

  return "Clean performance visualization for quick portfolio reading.";
}
