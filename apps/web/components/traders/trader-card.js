"use client";

import Link from "next/link";
import { ArrowUpRight, CopyPlus, Heart, Scale, Star } from "lucide-react";
import Button from "@/components/ui/button";
import InitialAvatar from "@/components/ui/initial-avatar";
import MiniPerformanceChart from "@/components/charts/mini-performance-chart";
import {
  compact,
  currency,
  formatPercentage,
  number,
} from "@/lib/formatters";

export default function TraderCard({
  trader,
  onFavorite,
  onCopy,
  onCompareToggle,
  selectedForCompare,
}) {
  const liveCopied = Boolean(trader.copyModes?.live);
  const mockCopied = Boolean(trader.copyModes?.mock);

  return (
    <article className="panel grid gap-5 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <InitialAvatar name={trader.name} status={trader.status} stacked />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-xl font-semibold">{trader.name}</h3>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                {trader.marketType}
              </span>
              {trader.dailyPick ? (
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-400">
                  Daily Pick
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-[var(--foreground)]/78">
              {trader.portfolioName}
            </p>
            <p className="muted mt-1 text-sm">
              {trader.location.city}, {trader.location.country}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={`rounded-2xl border p-2 transition ${
              trader.isFavorite
                ? "border-amber-400 bg-amber-400/15 text-amber-400"
                : "border-[var(--border)] text-[var(--foreground)]/75 hover:bg-white/10"
            }`}
            onClick={() => onFavorite?.(trader)}
            aria-label="Add to favorites"
          >
            {trader.isFavorite ? (
              <Star className="h-4 w-4 fill-current" />
            ) : (
              <Heart className="h-4 w-4" />
            )}
          </button>
          <button
            className={`rounded-2xl border p-2 transition ${
              selectedForCompare
                ? "border-sky-400 bg-sky-400/15 text-sky-400"
                : "border-[var(--border)] text-[var(--foreground)]/75 hover:bg-white/10"
            }`}
            onClick={() => onCompareToggle?.(trader)}
            aria-label="Compare trader"
          >
            <Scale className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Follower Capacity" value={`${trader.followers.current}/${trader.followers.max}`} />
        <Metric label="30-Day PnL" value={currency(trader.performance.pnl30d)} tone="emerald" />
        <Metric label="ROI" value={formatPercentage(trader.performance.roi30d)} tone="sky" />
        <Metric label="AUM" value={compact(trader.performance.aum)} />
        <Metric label="MDD" value={formatPercentage(trader.performance.mdd)} />
        <Metric label="Sharpe Ratio" value={number(trader.performance.sharpeRatio)} />
      </div>

      <div className="soft-panel p-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="muted">Mini performance graph</span>
          <span className="font-semibold text-emerald-400">
            +{number(trader.performance.roi30d)}%
          </span>
        </div>
        <MiniPerformanceChart data={trader.performance.timeline} trader={trader} />
      </div>

      <p className="text-sm leading-6 text-[var(--foreground)]/76">
        {trader.note}
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={mockCopied}
            onClick={() => onCopy?.(trader, "mock")}
          >
            <CopyPlus className="h-4 w-4" />
            {mockCopied ? "Mock Active" : "Mock Copy"}
          </Button>
          {liveCopied ? (
            <Button variant="outline" size="sm" disabled>
              Live Copied
            </Button>
          ) : trader.capacityReached ? (
            <Button variant="outline" size="sm" disabled>
              Full
            </Button>
          ) : (
            <Button size="sm" onClick={() => onCopy?.(trader, "live")}>
              Copy
            </Button>
          )}
        </div>
        <Link
          href={`/traders/${trader.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400"
        >
          View portfolio
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function Metric({ label, value, tone }) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "sky"
        ? "text-sky-400"
        : "text-[var(--foreground)]";

  return (
    <div className="soft-panel px-4 py-3">
      <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
