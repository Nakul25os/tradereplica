"use client";

import Link from "next/link";
import { Bell, Globe2, MenuSquare, Moon, SunMedium, UserRound, Wallet } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useAuth, useTheme } from "@/components/providers";
import Button from "@/components/ui/button";

const markets = [
  {
    label: "Indian Stock Market",
    href: "/?marketType=Indian%20Stock%20Market#trader-discovery",
  },
  {
    label: "Forex Market",
    href: "/?marketType=Forex%20Market#trader-discovery",
  },
  {
    label: "Crypto Market",
    href: "/?marketType=Crypto%20Market#trader-discovery",
  },
];

export default function Navbar() {
  const { authenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const searchParams = useSearchParams();
  const activeMarket = searchParams.get("marketType") || "All Markets";

  return (
    <header className="sticky top-4 z-50 mt-4">
      <div className="panel-strong flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#10b981,#38bdf8)] text-lg font-black text-slate-950">
              TR
            </div>
            <div>
              <p className="font-display text-xl font-semibold">TradeReplica</p>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
                Copy Trading Desk
              </p>
            </div>
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm">
            {markets.map((item) => (
              <Link
                href={item.href}
                key={item.label}
                className={`rounded-full border px-3 py-2 transition ${
                  activeMarket === item.label
                    ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                    : "border-[var(--border)] text-[var(--foreground)]/80 hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          <Button href="/deposit" variant="secondary" size="sm">
            Deposit
          </Button>
          <Button href="/wallet" variant="ghost" size="sm">
            <Wallet className="h-4 w-4" />
            Wallet
          </Button>
          <Button href="/messages" variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
            Messaging
          </Button>
          <div className="flex h-9 items-center gap-2 rounded-2xl border border-[var(--border)] px-3 text-sm">
            <Globe2 className="h-4 w-4 text-emerald-400" />
            <select className="bg-transparent outline-none">
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <SunMedium className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {authenticated ? (
            <>
              <div className="hidden rounded-2xl border border-[var(--border)] px-3 py-2 text-sm md:block">
                <p className="font-semibold">{user?.username}</p>
                <p className="muted text-xs">{user?.email}</p>
              </div>
              <Button href="/profile" variant="ghost" size="sm">
                <UserRound className="h-4 w-4" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  <MenuSquare className="h-4 w-4" />
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
