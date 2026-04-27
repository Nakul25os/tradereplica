"use client";

import { useEffect, useState } from "react";
import { Languages, Scale, SlidersHorizontal, Target, TrendingUp } from "lucide-react";
import Button from "@/components/ui/button";
import InitialAvatar from "@/components/ui/initial-avatar";
import PerformanceChart from "@/components/charts/performance-chart";
import ChartTypeSelector from "@/components/charts/chart-type-selector";
import AssetAllocationChart from "@/components/charts/asset-allocation-chart";
import { apiRequest } from "@/lib/api";
import { upsertCompareSelection } from "@/lib/compare";
import {
  compact,
  currency,
  formatDateTime,
  formatPercentage,
  number,
} from "@/lib/formatters";
import { useAuth } from "@/components/providers";
import { useRouter } from "next/navigation";

const metrics = [
  ["ROI", (trader) => formatPercentage(trader.performance.roi30d), "text-emerald-400"],
  ["PnL", (trader) => currency(trader.performance.pnl30d), "text-sky-400"],
  ["Copier PnL", (trader) => currency(trader.performance.copierPnl), "text-amber-400"],
  ["Sharpe Ratio", (trader) => number(trader.performance.sharpeRatio), ""],
  ["MDD", (trader) => formatPercentage(trader.performance.mdd), ""],
  ["Win Rate", (trader) => formatPercentage(trader.performance.winRate), ""],
  ["Win Positions", (trader) => String(trader.performance.winPositions), ""],
  ["Total Positions", (trader) => String(trader.performance.totalPositions), ""],
];

export default function TraderDetailView({ traderId }) {
  const router = useRouter();
  const { authenticated, token, logout } = useAuth();
  const [trader, setTrader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [activeMetric, setActiveMetric] = useState("roi");
  const [chartType, setChartType] = useState("area");
  const [activeTab, setActiveTab] = useState("positions");
  const [sortOrder, setSortOrder] = useState("desc");
  const liveCopied = Boolean(trader?.copyModes?.live);
  const mockCopied = Boolean(trader?.copyModes?.mock);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedChartType = window.localStorage.getItem(
      "tradereplica_chart_type"
    );

    if (storedChartType) {
      setChartType(storedChartType);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("tradereplica_chart_type", chartType);
  }, [chartType]);

  useEffect(() => {
    let active = true;

    const loadTrader = async () => {
      setLoading(true);

      try {
        const response = await apiRequest(`/traders/${traderId}?order=${sortOrder}`, {
          token,
        });

        if (!active) {
          return;
        }

        setTrader(response.trader);
      } catch (error) {
        if (!active) {
          return;
        }

        setMessage(error.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTrader();

    return () => {
      active = false;
    };
  }, [sortOrder, token, traderId]);

  const filteredTrades = !trader
    ? []
    : activeTab === "positions"
      ? trader.trades.filter((trade) => trade.status === "Open")
      : activeTab === "position-history"
        ? trader.trades.filter((trade) => trade.status === "Closed")
        : [];

  const handleCopy = async (mode) => {
    if (!authenticated || !token) {
      router.push("/login");
      return;
    }

    try {
      const response = await apiRequest(`/traders/${trader.id}/copy`, {
        method: "POST",
        token,
        body: {
          mode,
          amount: trader.overview.minimumCopyAmount,
        },
      });

      setMessage(response.message);
      const traderResponse = await apiRequest(
        `/traders/${traderId}?order=${sortOrder}`,
        { token }
      );
      setTrader(traderResponse.trader);
    } catch (error) {
      if (error.status === 401) {
        logout();
        setMessage("Session expired. Please log in again to copy trades.");
        router.push("/login");
        return;
      }

      setMessage(error.message);
    }
  };

  const handleCompare = () => {
    if (!trader) {
      return;
    }

    upsertCompareSelection(trader);
    router.push("/#compare-panel");
  };

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="panel h-44 animate-pulse" />
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="panel h-[520px] animate-pulse" />
          <div className="panel h-[520px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="panel p-10 text-center">
        <p className="text-lg font-semibold">Trader not found.</p>
        <p className="muted mt-2 text-sm">{message || "Please check the portfolio link."}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <section className="panel-strong p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <InitialAvatar name={trader.name} status={trader.status} size="lg" stacked />
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                    {trader.marketType}
                  </span>
                  <span className="rounded-full bg-rose-500/15 px-3 py-1 text-xs font-semibold text-rose-300">
                    {trader.riskTag}
                  </span>
                </div>
                <div>
                  <h1 className="page-title">{trader.portfolioName}</h1>
                  <p className="mt-1 text-lg font-semibold">{trader.name}</p>
                  <p className="muted mt-1 text-sm">
                    {trader.location.city}, {trader.location.country}
                  </p>
                </div>
                <p className="max-w-3xl text-sm leading-7 text-[var(--foreground)]/78">
                  {trader.note}
                </p>
                <div className="soft-panel flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <Languages className="h-4 w-4 text-sky-400" />
                  <span>{trader.translation}</span>
                  <span className="font-semibold text-sky-400">
                    View Translation
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Stat label="Days Trading" value={trader.stats.daysTrading} />
              <Stat
                label="Copiers"
                value={`${trader.stats.currentCopiers}/${trader.stats.maxCopiers}`}
              />
              <Stat label="Total Copiers" value={trader.stats.totalCopiers} />
              <Stat label="Mock Copiers" value={trader.stats.mockCopiers} />
              <Stat label="Closed Portfolios" value={trader.stats.closedPortfolios} />
              <Stat label="AUM" value={compact(trader.performance.aum)} />
            </div>
          </div>

          <div className="soft-panel flex flex-col justify-between p-5">
            <div>
              <p className="eyebrow">Quick Actions</p>
              <h2 className="section-title mt-2">Copy or compare this strategy</h2>
            </div>
            <div className="grid gap-3">
              <Button
                size="lg"
                disabled={liveCopied || trader.capacityReached}
                onClick={() => handleCopy("live")}
              >
                <Target className="h-4 w-4" />
                {liveCopied ? "Live Copied" : trader.capacityReached ? "Portfolio Full" : "Copy"}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                disabled={mockCopied}
                onClick={() => handleCopy("mock")}
              >
                {mockCopied ? "Mock Active" : "Mock Copy"}
              </Button>
              <Button variant="outline" size="lg" onClick={handleCompare}>
                <Scale className="h-4 w-4" />
                Compare
              </Button>
            </div>
            {message ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
                {message}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Performance</p>
              <h2 className="section-title mt-2">Key metrics</h2>
            </div>
            <TrendingUp className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {metrics.map(([label, getter, tone]) => (
              <div key={label} className="soft-panel px-4 py-4">
                <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
                <p className={`mt-2 text-xl font-semibold ${tone}`}>{getter(trader)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Performance Section</p>
              <h2 className="section-title mt-2">ROI / PnL time graph</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant={activeMetric === "roi" ? "primary" : "outline"}
                onClick={() => setActiveMetric("roi")}
              >
                ROI
              </Button>
              <Button
                size="sm"
                variant={activeMetric === "pnl" ? "primary" : "outline"}
                onClick={() => setActiveMetric("pnl")}
              >
                PnL
              </Button>
              <div className="hidden h-8 w-px bg-white/10 md:block" />
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/58">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Chart Filter
                </span>
                <ChartTypeSelector
                  value={chartType}
                  onChange={setChartType}
                />
              </div>
            </div>
          </div>
          <div className="mt-6">
            <PerformanceChart
              data={trader.performance.timeline}
              metric={activeMetric}
              trader={trader}
              chartType={chartType}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="panel p-6">
          <p className="eyebrow">Trader Overview</p>
          <h2 className="section-title mt-2">Portfolio economics</h2>
          <div className="mt-6 grid gap-3">
            <OverviewMetric label="AUM" value={compact(trader.performance.aum)} />
            <OverviewMetric
              label="Profit Sharing"
              value={formatPercentage(trader.overview.profitSharing)}
            />
            <OverviewMetric
              label="Leading Margin Balance"
              value={`${number(trader.overview.leadingMarginBalance, 2)} USDT`}
            />
            <OverviewMetric
              label="Minimum Copy Amount"
              value={`${number(trader.overview.minimumCopyAmount, 2)} USDT`}
            />
          </div>
        </div>

        <div className="panel p-6">
          <p className="eyebrow">Asset Allocation</p>
          <h2 className="section-title mt-2">Donut view by exposure</h2>
          <div className="mt-6">
            <AssetAllocationChart data={trader.assetAllocation} />
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex flex-wrap gap-3">
          <TabButton
            active={activeTab === "positions"}
            onClick={() => setActiveTab("positions")}
          >
            Positions
          </TabButton>
          <TabButton
            active={activeTab === "position-history"}
            onClick={() => setActiveTab("position-history")}
          >
            Position History
          </TabButton>
          <TabButton
            active={activeTab === "copy-traders"}
            onClick={() => setActiveTab("copy-traders")}
          >
            Copy Traders
          </TabButton>
        </div>

        {activeTab === "copy-traders" ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {trader.copyTraders.map((copier) => (
              <div key={`${copier.alias}-${copier.startedAt}`} className="soft-panel p-4">
                <p className="font-semibold">{copier.alias}</p>
                <p className="muted mt-1 text-sm">Mode: {copier.mode}</p>
                <p className="muted mt-1 text-sm">
                  Started: {formatDateTime(copier.startedAt)}
                </p>
                <p className="mt-3 text-lg font-semibold text-emerald-400">
                  {number(copier.amount, 2)} USDT
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--border)]">
            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr_1.2fr_0.9fr_0.9fr_1fr_0.9fr_0.9fr] gap-4 border-b border-[var(--border)] bg-white/5 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/64">
              <span>Market Type</span>
              <span>Position</span>
              <span>Status</span>
              <button
                className="text-left"
                onClick={() =>
                  setSortOrder((current) => (current === "desc" ? "asc" : "desc"))
                }
              >
                Open Time
              </button>
              <span>Close Time</span>
              <span>Entry</span>
              <span>Avg Close</span>
              <span>Max OI</span>
              <span>Closed Vol</span>
              <span>PnL</span>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {filteredTrades.length > 0 ? (
                filteredTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="grid grid-cols-[1.2fr_0.9fr_0.9fr_1.2fr_1.2fr_0.9fr_0.9fr_1fr_0.9fr_0.9fr] gap-4 px-4 py-4 text-sm"
                  >
                    <div>
                      <p>{trade.marketType}</p>
                      <p className="muted mt-1 text-xs">{trade.instrument}</p>
                    </div>
                    <span>{trade.positionType}</span>
                    <span>{trade.status}</span>
                    <span>{formatDateTime(trade.openTime)}</span>
                    <span>{formatDateTime(trade.closeTime)}</span>
                    <span>{number(trade.entryPrice, 2)}</span>
                    <span>{trade.avgClosePrice ? number(trade.avgClosePrice, 2) : "-"}</span>
                    <span>{compact(trade.maxOpenInterest)}</span>
                    <span>{number(trade.closedVolume, 2)}</span>
                    <span className={trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                      {number(trade.pnl, 2)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-10 text-center text-sm text-[var(--foreground)]/70">
                  {activeTab === "positions"
                    ? "No open positions are available right now."
                    : "No closed positions are available for this view."}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="soft-panel px-4 py-3">
      <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function OverviewMetric({ label, value }) {
  return (
    <div className="soft-panel px-4 py-4">
      <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-emerald-500 text-slate-950"
          : "border border-[var(--border)]"
      }`}
    >
      {children}
    </button>
  );
}
