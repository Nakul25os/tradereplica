"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/providers";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: form,
      });

      login(response);
      router.push("/");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="panel-strong mx-auto grid w-full max-w-xl gap-5 p-6 md:p-8">
      <div>
        <p className="eyebrow">Login</p>
        <h1 className="page-title mt-2">Access your TradeReplica desk</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)]/72">
          Use your email or username and password to open the copy trading dashboard.
        </p>
      </div>

      <label className="grid gap-2 text-sm font-medium">
        Email or Username
        <input
          required
          value={form.identifier}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              identifier: event.target.value,
            }))
          }
          className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
          placeholder="yourname or you@example.com"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium">
        Password
        <input
          required
          type="password"
          value={form.password}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              password: event.target.value,
            }))
          }
          className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
          placeholder="Minimum 8 characters"
        />
      </label>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/forgot-password" className="text-sm font-semibold text-sky-400">
          Forgot Password?
        </Link>
        <Link href="/signup" className="text-sm font-semibold text-emerald-400">
          Create Account
        </Link>
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </Button>
    </form>
  );
}

