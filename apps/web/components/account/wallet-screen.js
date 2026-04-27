"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRightLeft,
  Landmark,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { apiRequest } from "@/lib/api";
import { currency, formatDateTime, number } from "@/lib/formatters";
import Button from "@/components/ui/button";
import AuthRequiredPanel from "@/components/account/auth-required-panel";

export default function WalletScreen() {
  const { authenticated, loading: authLoading, token, user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletState, setWalletState] = useState({
    wallet: null,
    transactions: [],
  });
  const [favorites, setFavorites] = useState([]);
  const [tradersById, setTradersById] = useState({});

  useEffect(() => {
    if (!authenticated || !token) {
      setLoading(false);
      setWalletState({
        wallet: null,
        transactions: [],
      });
      setFavorites([]);
      setTradersById({});
      return;
    }

    let active = true;

    const loadWallet = async () => {
      setLoading(true);
      setError("");

      try {
        const [walletResponse, tradersResponse, favoritesResponse] = await Promise.all([
          apiRequest("/wallet", { token }),
          apiRequest("/traders", { token }),
          apiRequest("/traders?onlyFavorites=true", { token }),
        ]);

        if (!active) {
          return;
        }

        setWalletState(walletResponse);
        setFavorites(favoritesResponse.traders);
        setTradersById(
          tradersResponse.traders.reduce((accumulator, trader) => {
            accumulator[trader.id] = trader;
            return accumulator;
          }, {})
        );
      } catch (nextError) {
        if (!active) {
          return;
        }

        if (nextError.status === 401) {
          logout();
          return;
        }

        setError(nextError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadWallet();

    return () => {
      active = false;
    };
  }, [authenticated, logout, token]);

  if (authLoading || loading) {
    return (
      <div className="grid gap-6">
        <div className="panel h-44 animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel h-[420px] animate-pulse" />
          <div className="panel h-[420px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AuthRequiredPanel
        title="Open your TradeReplica wallet"
        description="Sign in to view balances, active copy allocations, funding history, and saved portfolios."
      />
    );
  }

  const copiedPortfolios = user?.copiedPortfolios || [];
  const wallet = walletState.wallet;

  return (
    <div className="grid gap-6">
      <section className="panel-strong p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Wallet</p>
            <h1 className="page-title mt-2">Capital overview and copy allocation</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--foreground)]/76">
              Track available margin, funds locked in live copy trades, deposit flow, and your
              strategy watchlist from one account center.
            </p>
          </div>
          <div className="soft-panel grid gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-400">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Funding Desk</p>
                <p className="muted text-sm">
                  Last credit: {wallet?.lastFundingAt ? formatDateTime(wallet.lastFundingAt) : "No deposits yet"}
                </p>
              </div>
            </div>
            <p className="text-sm leading-6 text-[var(--foreground)]/76">
              Deposit funds, inspect your ledger trail, and then allocate live capital to traders
              without leaving the wallet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/deposit">Deposit Funds</Button>
              <Button href="/#trader-discovery" variant="outline">
                Discover Traders
              </Button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WalletMetric
          label="Total Margin Balance"
          value={`${number(wallet?.marginBalance, 2)} USDT`}
          tone="text-emerald-400"
        />
        <WalletMetric
          label="Available Balance"
          value={`${number(wallet?.availableBalance, 2)} USDT`}
          tone="text-sky-400"
        />
        <WalletMetric
          label="Live Copy Locked"
          value={`${number(wallet?.copyLockedBalance, 2)} USDT`}
          tone="text-amber-400"
        />
        <WalletMetric
          label="Total Deposited"
          value={`${number(wallet?.totalDeposited, 2)} USDT`}
          tone="text-violet-300"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Copy Allocations</p>
              <h2 className="section-title mt-2">Live and mock sessions</h2>
            </div>
            <ArrowRightLeft className="h-5 w-5 text-emerald-400" />
          </div>

          <div className="mt-6 grid gap-4">
            {copiedPortfolios.length > 0 ? (
              copiedPortfolios.map((portfolio) => {
                const trader = tradersById[portfolio.trader];

                return (
                  <div key={`${portfolio.trader}-${portfolio.mode}`} className="soft-panel p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {trader?.name || "Trader portfolio"}
                        </p>
                        <p className="muted mt-1 text-sm">
                          {trader?.portfolioName || portfolio.trader}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                        {portfolio.mode}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
                      <div>
                        <p className="muted">Allocated</p>
                        <p className="mt-1 font-semibold text-sky-300">
                          {number(portfolio.amount, 2)} USDT
                        </p>
                      </div>
                      <div>
                        <p className="muted">Started</p>
                        <p className="mt-1 font-semibold">
                          {formatDateTime(portfolio.startedAt)}
                        </p>
                      </div>
                      <div>
                        <p className="muted">Market</p>
                        <p className="mt-1 font-semibold">
                          {trader?.marketType || "Linked Portfolio"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--foreground)]/70">
                No copy sessions are active yet. Deposit funds and start a live or mock copy from trader discovery.
              </div>
            )}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Wallet Ledger</p>
              <h2 className="section-title mt-2">Recent transactions</h2>
            </div>
            <WalletCards className="h-5 w-5 text-sky-400" />
          </div>

          <div className="mt-6 grid gap-4">
            {walletState.transactions.length > 0 ? (
              walletState.transactions.map((transaction) => (
                <div key={transaction.id} className="soft-panel p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{transaction.methodLabel}</p>
                      <p className="muted mt-1 text-sm">{transaction.referenceId}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          transaction.direction === "credit"
                            ? "text-emerald-400"
                            : "text-amber-300"
                        }`}
                      >
                        {transaction.direction === "credit" ? "+" : "-"}
                        {number(transaction.amountUsdt, 2)} USDT
                      </p>
                      <p className="muted mt-1 text-sm">
                        {transaction.amountInr
                          ? currency(transaction.amountInr, "INR")
                          : transaction.typeLabel}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
                    <div>
                      <p className="muted">Status</p>
                      <p className="mt-1 font-semibold capitalize">{transaction.status}</p>
                    </div>
                    <div>
                      <p className="muted">Balance After</p>
                      <p className="mt-1 font-semibold">
                        {number(transaction.balanceAfter, 2)} USDT
                      </p>
                    </div>
                    <div>
                      <p className="muted">Counterparty</p>
                      <p className="mt-1 font-semibold">{transaction.counterparty || "-"}</p>
                    </div>
                    <div>
                      <p className="muted">Created</p>
                      <p className="mt-1 font-semibold">
                        {formatDateTime(transaction.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--foreground)]/70">
                No wallet transactions yet. Your funding and live copy ledger will appear here.
              </div>
            )}

            <div className="soft-panel flex items-start gap-3 p-4">
              <ShieldCheck className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-semibold">Ledger integrity</p>
                <p className="muted mt-1 text-sm leading-6">
                  Live copy allocations now reserve available balance and every deposit or allocation
                  writes a timestamped wallet transaction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel p-6">
          <p className="eyebrow">Favorites</p>
          <h2 className="section-title mt-2">Watchlist-linked portfolios</h2>

          <div className="mt-6 grid gap-4">
            {favorites.length > 0 ? (
              favorites.map((trader) => (
                <Link
                  key={trader.id}
                  href={`/traders/${trader.id}`}
                  className="soft-panel block p-4 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{trader.name}</p>
                      <p className="muted mt-1 text-sm">{trader.portfolioName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">
                        {number(trader.performance.roi30d, 2)}%
                      </p>
                      <p className="muted mt-1 text-sm">
                        {currency(trader.performance.pnl30d)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--foreground)]/70">
                You have not added any favorite portfolios yet.
              </div>
            )}
          </div>
        </div>

        <div className="panel p-6">
          <p className="eyebrow">Capital Notes</p>
          <h2 className="section-title mt-2">Trading balance posture</h2>
          <div className="mt-6 grid gap-4">
            <CapitalNote
              title="Available for new copy trades"
              description={`You can deploy ${number(wallet?.availableBalance, 2)} USDT immediately into live copy allocations.`}
            />
            <CapitalNote
              title="Locked in live strategies"
              description={`${number(wallet?.copyLockedBalance, 2)} USDT is reserved by your active live copy sessions.`}
            />
            <CapitalNote
              title="Funding conversion"
              description={`All deposit forms currently convert INR into wallet USDT at ₹${number(wallet?.fxRateInrPerUsdt, 2)} per USDT.`}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function WalletMetric({ label, value, tone }) {
  return (
    <div className="panel px-5 py-5">
      <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function CapitalNote({ title, description }) {
  return (
    <div className="soft-panel p-4">
      <p className="font-semibold">{title}</p>
      <p className="muted mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}
