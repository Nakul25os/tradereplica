"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Heart, MessageSquareDot, Radar, Target } from "lucide-react";
import { useAuth } from "@/components/providers";
import { apiRequest } from "@/lib/api";
import { formatDateTime, number } from "@/lib/formatters";
import AuthRequiredPanel from "@/components/account/auth-required-panel";

export default function MessagesScreen() {
  const { authenticated, loading: authLoading, token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tradersById, setTradersById] = useState({});
  const [dailyPicks, setDailyPicks] = useState([]);

  useEffect(() => {
    if (!authenticated || !token) {
      setLoading(false);
      setTradersById({});
      setDailyPicks([]);
      return;
    }

    let active = true;

    const loadMessagesData = async () => {
      setLoading(true);
      setError("");

      try {
        const [tradersResponse, dailyPicksResponse] = await Promise.all([
          apiRequest("/traders", { token }),
          apiRequest("/traders?dailyPick=true", { token }),
        ]);

        if (!active) {
          return;
        }

        setTradersById(
          tradersResponse.traders.reduce((accumulator, trader) => {
            accumulator[trader.id] = trader;
            return accumulator;
          }, {})
        );
        setDailyPicks(dailyPicksResponse.traders);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(nextError.message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMessagesData();

    return () => {
      active = false;
    };
  }, [authenticated, token]);

  const messages = useMemo(() => {
    if (!user) {
      return [];
    }

    const activity = [
      {
        id: "security-verified",
        icon: Bell,
        tone: "text-emerald-400",
        title: "Account verification complete",
        body: "Your TradeReplica profile is verified and ready for secured copy trading access.",
        timestamp: new Date().toISOString(),
      },
      ...user.copiedPortfolios.map((portfolio) => {
        const trader = tradersById[portfolio.trader];

        return {
          id: `copy-${portfolio.trader}-${portfolio.mode}`,
          icon: Target,
          tone: portfolio.mode === "live" ? "text-emerald-400" : "text-sky-300",
          title: `${portfolio.mode === "live" ? "Live" : "Mock"} copy active`,
          body: `Your ${portfolio.mode} copy session is linked to ${trader?.name || "a trader portfolio"} with ${number(portfolio.amount, 2)} USDT allocated.`,
          timestamp: portfolio.startedAt,
          href: trader ? `/traders/${trader.id}` : "/",
        };
      }),
      ...(user.favorites.length > 0
        ? [
            {
              id: "favorites-watchlist",
              icon: Heart,
              tone: "text-amber-300",
              title: "Favorites watchlist updated",
              body: `You are following ${user.favorites.length} portfolio${user.favorites.length === 1 ? "" : "s"} for quick review.`,
              timestamp: new Date().toISOString(),
              href: "/wallet",
            },
          ]
        : []),
      ...dailyPicks.slice(0, 2).map((trader) => ({
        id: `daily-pick-${trader.id}`,
        icon: Radar,
        tone: "text-violet-300",
        title: "Daily pick spotlight",
        body: `${trader.name} is trending on the desk with ${number(trader.performance.roi30d, 2)}% 30-day ROI.`,
        timestamp: new Date().toISOString(),
        href: `/traders/${trader.id}`,
      })),
    ];

    return activity;
  }, [dailyPicks, tradersById, user]);

  if (authLoading || loading) {
    return (
      <div className="grid gap-6">
        <div className="panel h-36 animate-pulse" />
        <div className="panel h-[520px] animate-pulse" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AuthRequiredPanel
        title="Open your TradeReplica message center"
        description="Sign in to view portfolio alerts, copy trading activity, and platform notices."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section className="panel-strong p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Messages</p>
            <h1 className="page-title mt-2">Portfolio inbox and activity feed</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--foreground)]/76">
              Review copy activity, watchlist updates, and platform notices from a single messaging center.
            </p>
          </div>
          <div className="soft-panel flex items-center gap-3 px-4 py-3">
            <MessageSquareDot className="h-5 w-5 text-sky-400" />
            <div>
              <p className="font-semibold">{messages.length} active message{messages.length === 1 ? "" : "s"}</p>
              <p className="muted text-sm">Auto-generated from your dashboard activity</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <section className="panel p-6">
        <div className="grid gap-4">
          {messages.length > 0 ? (
            messages.map((message) => {
              const Icon = message.icon;

              const body = (
                <div className="soft-panel flex items-start gap-4 p-4 transition hover:-translate-y-0.5">
                  <div className={`rounded-2xl bg-white/5 p-3 ${message.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{message.title}</p>
                      <span className="muted text-xs">
                        {formatDateTime(message.timestamp)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/78">
                      {message.body}
                    </p>
                  </div>
                </div>
              );

              return message.href ? (
                <Link key={message.id} href={message.href}>
                  {body}
                </Link>
              ) : (
                <div key={message.id}>{body}</div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-12 text-center text-sm text-[var(--foreground)]/70">
              No messages yet. Start copying traders or building a favorites watchlist to populate this inbox.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

