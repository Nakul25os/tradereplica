"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  LockKeyhole,
  Mail,
  Shield,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { apiRequest } from "@/lib/api";
import Button from "@/components/ui/button";
import AuthRequiredPanel from "@/components/account/auth-required-panel";

export default function ProfileScreen() {
  const { authenticated, loading: authLoading, token, user, logout } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authenticated || !token) {
      setLoading(false);
      setSummary(null);
      return;
    }

    let active = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest("/dashboard/summary", { token });

        if (!active) {
          return;
        }

        setSummary(response);
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

    loadProfile();

    return () => {
      active = false;
    };
  }, [authenticated, token]);

  if (authLoading || loading) {
    return (
      <div className="grid gap-6">
        <div className="panel h-40 animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel h-[380px] animate-pulse" />
          <div className="panel h-[380px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AuthRequiredPanel
        title="Open your TradeReplica profile"
        description="Sign in to review your verification status, account summary, and quick access tools."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section className="panel-strong p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[linear-gradient(135deg,#22c55e,#0f172a)] text-2xl font-black text-white">
              {String(user?.username || "TR").slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="eyebrow">Profile</p>
              <h1 className="page-title mt-2">{user?.username}</h1>
              <p className="mt-2 text-sm text-[var(--foreground)]/76">{user?.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">
                  {user?.verified ? "Email Verified" : "Verification Pending"}
                </span>
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                  Aadhaar Validation Complete
                </span>
              </div>
            </div>
          </div>

          <div className="soft-panel grid gap-4 p-5">
            <div className="flex items-start gap-3">
              <Shield className="mt-1 h-5 w-5 text-emerald-400" />
              <div>
                <p className="font-semibold">Security posture</p>
                <p className="muted mt-1 text-sm leading-6">
                  JWT authentication is active, passwords are hashed, and Aadhaar data is stored encrypted on the backend.
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel p-6">
          <p className="eyebrow">Account Overview</p>
          <h2 className="section-title mt-2">Identity and activity</h2>
          <div className="mt-6 grid gap-4">
            <ProfileRow icon={UserRound} label="Username" value={user?.username} />
            <ProfileRow icon={Mail} label="Email" value={user?.email} />
            <ProfileRow
              icon={BadgeCheck}
              label="Verification"
              value={user?.verified ? "Verified" : "Pending"}
            />
            <ProfileRow
              icon={LockKeyhole}
              label="Active Copies"
              value={String(user?.copiedPortfolios?.length || 0)}
            />
          </div>
        </div>

        <div className="panel p-6">
          <p className="eyebrow">Quick Access</p>
          <h2 className="section-title mt-2">Navigate account tools</h2>
          <div className="mt-6 grid gap-4">
            <Link href="/wallet" className="soft-panel block p-4 transition hover:-translate-y-0.5">
              <p className="font-semibold">Wallet</p>
              <p className="muted mt-1 text-sm">
                Review margin balance and copy allocations.
              </p>
            </Link>
            <Link href="/messages" className="soft-panel block p-4 transition hover:-translate-y-0.5">
              <p className="font-semibold">Messages</p>
              <p className="muted mt-1 text-sm">
                See account activity and portfolio notices.
              </p>
            </Link>
            <div className="soft-panel p-4">
              <p className="font-semibold">Dashboard summary</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="muted">Favorites</p>
                  <p className="mt-1 font-semibold text-amber-300">
                    {summary?.copyOverview?.favoriteCount || 0}
                  </p>
                </div>
                <div>
                  <p className="muted">Active Copies</p>
                  <p className="mt-1 font-semibold text-emerald-400">
                    {summary?.copyOverview?.activeCopies || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="soft-panel flex items-center gap-3 p-4">
      <div className="rounded-2xl bg-white/5 p-3">
        <Icon className="h-4 w-4 text-emerald-400" />
      </div>
      <div>
        <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
        <p className="mt-1 font-semibold">{value}</p>
      </div>
    </div>
  );
}
