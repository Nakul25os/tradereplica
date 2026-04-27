"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

const initialForm = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  aadhaarNumber: "",
};

export default function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState("signup");
  const [form, setForm] = useState(initialForm);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest("/auth/signup", {
        method: "POST",
        body: form,
      });

      setStep("verify");
      setMessage(response.message);
      setPreview(response.preview || "");
      setDevOtp(response.devOtp || "");
      setDeliveryMode(response.deliveryMode || "");
      setOtp(response.devOtp || "");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest("/auth/verify-email", {
        method: "POST",
        body: {
          email: form.email,
          otp,
        },
      });

      setMessage(response.message);
      setTimeout(() => router.push("/login"), 900);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest("/auth/resend-otp", {
        method: "POST",
        body: {
          email: form.email,
          purpose: "email_verification",
        },
      });

      setMessage(response.message);
      setPreview(response.preview || "");
      setDevOtp(response.devOtp || "");
      setDeliveryMode(response.deliveryMode || "");
      setOtp(response.devOtp || "");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6 xl:grid-cols-[1fr_0.92fr]">
      <div className="panel-strong p-6 md:p-8">
        <p className="eyebrow">Signup</p>
        <h1 className="page-title mt-2">Open a verified copy trading account</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--foreground)]/74">
          Create your TradeReplica account with Aadhaar format validation, email OTP
          verification, and secure activation before first login.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Feature title="Secure onboarding" description="Passwords are hashed and Aadhaar data is encrypted before storage." />
          <Feature title="OTP verification" description="Email verification is required before the account becomes active." />
          <Feature title="Mock Aadhaar API" description="The signup flow simulates verification without a real Aadhaar integration." />
          <Feature title="JWT access" description="Login sessions use token-based authentication for the dashboard and trader actions." />
        </div>
      </div>

      <form
        onSubmit={step === "signup" ? handleSignup : handleVerify}
        className="panel-strong grid gap-5 p-6 md:p-8"
      >
        {step === "signup" ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              Username
              <input
                required
                value={form.username}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
                placeholder="trader_name"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
                placeholder="name@example.com"
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
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

              <label className="grid gap-2 text-sm font-medium">
                Confirm Password
                <input
                  required
                  type="password"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
                  placeholder="Repeat password"
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              Aadhaar Number
              <input
                required
                inputMode="numeric"
                maxLength={12}
                value={form.aadhaarNumber}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    aadhaarNumber: event.target.value.replace(/\D/g, "").slice(0, 12),
                  }))
                }
                className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
                placeholder="12-digit Aadhaar number"
              />
            </label>
          </>
        ) : (
          <>
            <div>
              <p className="eyebrow">Verify Email</p>
              <h2 className="section-title mt-2">Enter the OTP sent to {form.email}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/72">
                Your account stays inactive until this OTP is confirmed.
              </p>
            </div>

            <label className="grid gap-2 text-sm font-medium">
              OTP Code
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
                placeholder="6-digit OTP"
              />
            </label>
          </>
        )}

        {message ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
            {message}
          </div>
        ) : null}

        {preview ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs leading-6 text-[var(--foreground)]/80">
            Dev mail preview:
            <pre className="mt-2 overflow-auto whitespace-pre-wrap">{preview}</pre>
          </div>
        ) : null}

        {deliveryMode === "preview" && devOtp ? (
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-4">
            <p className="text-sm font-semibold text-sky-300">
              Local development mode
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/80">
              SMTP is not configured, so no real email was sent. Use this OTP to
              verify the account locally.
            </p>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-sky-400/20 bg-slate-950/40 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.24em] text-sky-300">
                OTP Code
              </span>
              <span className="font-display text-2xl font-semibold tracking-[0.32em] text-white">
                {devOtp}
              </span>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/login" className="text-sm font-semibold text-sky-400">
            Already have an account?
          </Link>
          {step === "verify" ? (
            <button
              type="button"
              onClick={resendOtp}
              className="text-sm font-semibold text-emerald-400"
            >
              Resend OTP
            </button>
          ) : null}
        </div>

        <Button type="submit" size="lg" disabled={loading}>
          {loading
            ? step === "signup"
              ? "Submitting..."
              : "Verifying..."
            : step === "signup"
              ? "Create Account"
              : "Verify OTP"}
        </Button>
      </form>
    </div>
  );
}

function Feature({ title, description }) {
  return (
    <div className="soft-panel p-4">
      <p className="font-semibold">{title}</p>
      <p className="muted mt-2 text-sm leading-6">{description}</p>
    </div>
  );
}
