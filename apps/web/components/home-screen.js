"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { Filter, Search, Sparkles, TrendingUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers";
import Button from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import TraderCard from "@/components/traders/trader-card";
import { apiRequest, buildQuery } from "@/lib/api";
import {
  readCompareSelection,
  writeCompareSelection,
} from "@/lib/compare";
import { compact, currency, formatPercentage, number } from "@/lib/formatters";

const defaultSummary = {
  marginBalance: 0,
  unrealizedPnl: 0,
  copyOverview: {
    activeCopies: 0,
    favoriteCount: 0,
  },
  topTraders: [],
  dailyPicks: [],
};

const marketOptions = [
  "All Markets",
  "Indian Stock Market",
  "Forex Market",
  "Crypto Market",
];

export default function HomeScreen({ initialMarketType }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, authenticated, refreshUser, logout } = useAuth();
  const [summary, setSummary] = useState(defaultSummary);
  const [traders, setTraders] = useState([]);
  const [dailyPicks, setDailyPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [comparison, setComparison] = useState([]);
  const [filters, setFilters] = useState({
    tab: "all",
    timeFilter: "30 Days",
    marketType: "All Markets",
    minPnl: "",
    smart: false,
    search: "",
  });

  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    const marketFromUrl =
      searchParams.get("marketType") || initialMarketType || "All Markets";

    if (!marketOptions.includes(marketFromUrl)) {
      return;
    }

    setFilters((current) =>
      current.marketType === marketFromUrl
        ? current
        : {
            ...current,
            marketType: marketFromUrl,
          }
    );
  }, [initialMarketType, searchParams]);

  useEffect(() => {
    setComparison(readCompareSelection());
  }, []);

  useEffect(() => {
    writeCompareSelection(comparison);
  }, [comparison]);

  useEffect(() => {
    if (
      comparison.length > 0 &&
      typeof window !== "undefined" &&
      window.location.hash === "#compare-panel"
    ) {
      document.getElementById("compare-panel")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [comparison]);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!authenticated || !token) {
        setSummary(defaultSummary);
        return;
      }

      try {
        const response = await apiRequest("/dashboard/summary", { token });
        setSummary(response);
      } catch (error) {
        setSummary(defaultSummary);
      }
    };

    loadDashboard();
  }, [authenticated, token]);

  useEffect(() => {
    let active = true;

    const loadTraders = async () => {
      setLoading(true);

      try {
        if (filters.tab === "favorites" && !authenticated) {
          if (!active) {
            return;
          }

          setNotice("Log in to see and manage your favorite portfolios.");
          setTraders([]);
          setDailyPicks([]);
          setLoading(false);
          return;
        }

        const query = buildQuery({
          search: deferredSearch,
          timeFilter: filters.timeFilter,
          marketType: filters.marketType,
          minPnl: filters.minPnl,
          smart: filters.smart,
          onlyFavorites: filters.tab === "favorites",
        });
        const response = await apiRequest(`/traders${query}`, {
          token,
        });

        if (!active) {
          return;
        }

        setTraders(response.traders);
        setDailyPicks(response.dailyPicks);
        setNotice("");
      } catch (error) {
        if (!active) {
          return;
        }

        setNotice(error.message);
        setTraders([]);
        setDailyPicks([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTraders();

    return () => {
      active = false;
    };
  }, [
    authenticated,
    deferredSearch,
    filters.marketType,
    filters.minPnl,
    filters.smart,
    filters.tab,
    filters.timeFilter,
    token,
  ]);

  const requireLogin = () => {
    router.push("/login");
  };

  const patchTraderCollections = (traderId, updater) => {
    setTraders((current) =>
      current
        .map((item) => (item.id === traderId ? updater(item) : item))
        .filter(Boolean)
    );
    setDailyPicks((current) =>
      current
        .map((item) => (item.id === traderId ? updater(item) : item))
        .filter(Boolean)
    );
    setComparison((current) =>
      current
        .map((item) => (item.id === traderId ? updater(item) : item))
        .filter(Boolean)
    );
  };

  const handleFavorite = async (trader) => {
    if (!authenticated || !token) {
      requireLogin();
      return;
    }

    try {
      const response = await apiRequest(`/traders/${trader.id}/favorite`, {
        method: "POST",
        token,
      });

      setNotice(response.message);
      patchTraderCollections(trader.id, (item) => {
        const nextTrader = { ...item, isFavorite: !item.isFavorite };

        if (filters.tab === "favorites" && !nextTrader.isFavorite) {
          return null;
        }

        return nextTrader;
      });
      await refreshUser();
    } catch (error) {
      if (error.status === 401) {
        logout();
        setNotice("Session expired. Please log in again to manage favorites.");
        router.push("/login");
        return;
      }

      setNotice(error.message);
    }
  };

  const handleCopy = async (trader, mode) => {
    if (!authenticated || !token) {
      requireLogin();
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

      setNotice(response.message);
      const traderQuery = buildQuery({
        search: deferredSearch,
        timeFilter: filters.timeFilter,
        marketType: filters.marketType,
        minPnl: filters.minPnl,
        smart: filters.smart,
        onlyFavorites: filters.tab === "favorites",
      });
      const [dashboard, traderResponse] = await Promise.all([
        apiRequest("/dashboard/summary", { token }),
        apiRequest(`/traders${traderQuery}`, { token }),
        refreshUser(),
      ]);

      setTraders(traderResponse.traders);
      setDailyPicks(traderResponse.dailyPicks);
      setSummary(dashboard);
    } catch (error) {
      if (error.status === 401) {
        logout();
        setNotice("Session expired. Please log in again to copy trades.");
        router.push("/login");
        return;
      }

      setNotice(error.message);
    }
  };

  const toggleCompare = (trader) => {
    setComparison((current) => {
      const exists = current.find((item) => item.id === trader.id);

      if (exists) {
        return current.filter((item) => item.id !== trader.id);
      }

      if (current.length >= 2) {
        setNotice("Compare supports up to two traders at a time.");
        return current;
      }

      return [...current, trader];
    });
  };

  const resetFilters = () => {
    setFilters({
      tab: "all",
      timeFilter: "30 Days",
      marketType: "All Markets",
      minPnl: "",
      smart: false,
      search: "",
    });
    setNotice("Filters reset to the default dashboard view.");
  };

  const openCompare = () => {
    if (comparison.length === 0) {
      setNotice("Select up to two traders with the compare icon to review them side by side.");
      return;
    }

    document.getElementById("compare-panel")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="panel-strong overflow-hidden p-6 md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <p className="eyebrow">Professional Copy Trading</p>
              <h1 className="page-title max-w-2xl">
                Discover disciplined traders across Indian stocks, forex, and crypto.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--foreground)]/74">
                TradeReplica brings verified strategy leaders, portfolio analytics,
                and mock-to-live copy workflows into a single pro-grade dashboard.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard
                  label="Total Margin Balance"
                  value={`${number(summary.marginBalance, 2)} USDT`}
                  accent="text-emerald-400"
                />
                <SummaryCard
                  label="Unrealized PnL"
                  value={number(summary.unrealizedPnl, 2)}
                  accent="text-sky-400"
                />
                <SummaryCard
                  label="Active Copies"
                  value={String(summary.copyOverview.activeCopies)}
                  accent="text-amber-400"
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() =>
                    document.getElementById("trader-discovery")?.scrollIntoView()
                  }
                >
                  Copy Overview
                </Button>
                <Link href="/signup">
                  <Button variant="outline" size="lg">
                    Start With OTP Signup
                  </Button>
                </Link>
              </div>
            </div>

            <div className="soft-panel grid gap-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Desk Highlights
                  </p>
                  <p className="muted text-sm">
                    Fast glance at leading portfolios
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>

              <div className="grid gap-3">
                {summary.topTraders.length > 0 ? (
                  summary.topTraders.map((trader) => (
                    <div
                      key={trader.id}
                      className="rounded-2xl border border-[var(--border)] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold">{trader.name}</p>
                          <p className="muted text-sm">{trader.portfolioName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-400">
                            {formatPercentage(trader.roi30d)}
                          </p>
                          <p className="muted text-sm">
                            {currency(trader.pnl30d)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--foreground)]/70">
                    Log in to pull your personalized copy overview.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Daily Picks</p>
              <h2 className="section-title mt-2">Today&apos;s leader board</h2>
            </div>
            <Sparkles className="h-6 w-6 text-amber-400" />
          </div>
          <div className="mt-5 grid gap-4">
            {(dailyPicks.length > 0 ? dailyPicks : traders.slice(0, 2)).map((pick) => (
              <Link
                key={pick.id}
                href={`/traders/${pick.id}`}
                className="soft-panel block p-4 transition hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{pick.name}</p>
                    <p className="muted text-sm">{pick.marketType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-400">
                      {formatPercentage(pick.performance?.roi30d ?? pick.roi30d)}
                    </p>
                    <p className="muted text-sm">
                      {currency(pick.performance?.pnl30d ?? 0)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </section>

      <section id="trader-discovery" className="panel p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="eyebrow">Trader Discovery</p>
            <h2 className="section-title mt-2">Curated portfolios and live filters</h2>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <button
              className={`rounded-full px-4 py-2 font-semibold transition ${
                filters.tab === "all"
                  ? "bg-emerald-500 text-slate-950"
                  : "border border-[var(--border)]"
              }`}
              onClick={() => setFilters((current) => ({ ...current, tab: "all" }))}
            >
              All Portfolios
            </button>
            <button
              className={`rounded-full px-4 py-2 font-semibold transition ${
                filters.tab === "favorites"
                  ? "bg-emerald-500 text-slate-950"
                  : "border border-[var(--border)]"
              }`}
              onClick={() =>
                setFilters((current) => ({ ...current, tab: "favorites" }))
              }
            >
              My Favorites
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto_auto_auto]">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-[var(--border)] px-4">
            <Search className="h-4 w-4 text-emerald-400" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search trader by name"
              className="w-full bg-transparent outline-none"
            />
          </div>

          <select
            value={filters.timeFilter}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                timeFilter: event.target.value,
              }))
            }
            className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
          >
            <option>30 Days</option>
            <option>14 Days</option>
            <option>7 Days</option>
          </select>

          <div className="flex h-12 items-center rounded-2xl border border-[var(--border)] px-4">
            <input
              value={filters.minPnl}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  minPnl: event.target.value.replace(/[^\d.]/g, ""),
                }))
              }
              placeholder="PnL Filter"
              className="w-full bg-transparent outline-none"
            />
          </div>

          <label className="flex h-12 items-center justify-between rounded-2xl border border-[var(--border)] px-4 text-sm font-medium">
            Smart Filter
            <input
              type="checkbox"
              checked={filters.smart}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  smart: event.target.checked,
                }))
              }
              className="ml-3 h-4 w-4 rounded"
            />
          </label>

          <select
            value={filters.marketType}
            onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                marketType: event.target.value,
              }))
            }
            className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
          >
            {marketOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          <div className="flex gap-3">
            <button
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)]"
              onClick={resetFilters}
              aria-label="Reset dashboard filters"
              title="Reset filters"
            >
              <Filter className="h-4 w-4" />
            </button>
            <button
              className="inline-flex h-12 min-w-28 items-center justify-center rounded-2xl border border-[var(--border)] px-4 text-sm font-semibold"
              onClick={openCompare}
            >
              Compare {comparison.length}/2
            </button>
          </div>
        </div>

        {comparison.length > 0 ? (
          <div id="compare-panel" className="mt-4 rounded-3xl border border-sky-500/20 bg-sky-500/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-sky-300">Compare Portfolios</p>
                <p className="mt-1 text-sm text-[var(--foreground)]/78">
                  Review up to two traders side by side from anywhere in the dashboard.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setComparison([])}>
                Clear Compare
              </Button>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {comparison.map((trader) => (
                <div key={trader.id} className="soft-panel p-4">
                  <p className="font-semibold">{trader.name}</p>
                  <p className="muted mt-1 text-sm">{trader.portfolioName}</p>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="muted">ROI</p>
                      <p className="font-semibold text-emerald-400">
                        {formatPercentage(trader.performance.roi30d)}
                      </p>
                    </div>
                    <div>
                      <p className="muted">Sharpe</p>
                      <p className="font-semibold">
                        {number(trader.performance.sharpeRatio)}
                      </p>
                    </div>
                    <div>
                      <p className="muted">MDD</p>
                      <p className="font-semibold">
                        {formatPercentage(trader.performance.mdd)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {notice ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
            {notice}
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="panel p-5">
                  <Skeleton className="mb-4 h-14 w-3/4" />
                  <Skeleton className="mb-4 h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ))
            : traders.map((trader) => (
                <TraderCard
                  key={trader.id}
                  trader={trader}
                  onFavorite={handleFavorite}
                  onCopy={handleCopy}
                  onCompareToggle={toggleCompare}
                  selectedForCompare={comparison.some((item) => item.id === trader.id)}
                />
              ))}
        </div>

        {!loading && traders.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-[var(--border)] px-6 py-12 text-center">
            <p className="font-semibold">No traders match this filter set.</p>
            <p className="muted mt-2 text-sm">
              Adjust the search, market filter, smart toggle, or PnL threshold.
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="soft-panel px-4 py-4">
      <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}
