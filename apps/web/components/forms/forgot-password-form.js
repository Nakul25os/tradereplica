"use client";

import Link from "next/link";
import { useState } from "react";
import Button from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

const defaultResetForm = {
  email: "",
  otp: "",
  password: "",
  confirmPassword: "",
};

export default function ForgotPasswordForm() {
  const [step, setStep] = useState("email");
  const [form, setForm] = useState(defaultResetForm);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [deliveryMode, setDeliveryMode] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: {
          email: form.email,
        },
      });

      setStep("reset");
      setMessage(response.message);
      setPreview(response.preview || "");
      setDevOtp(response.devOtp || "");
      setDeliveryMode(response.deliveryMode || "");
      setForm((current) => ({
        ...current,
        otp: response.devOtp || current.otp,
      }));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await apiRequest("/auth/reset-password", {
        method: "POST",
        body: form,
      });

      setMessage(response.message);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={step === "email" ? requestOtp : resetPassword}
      className="panel-strong mx-auto grid w-full max-w-xl gap-5 p-6 md:p-8"
    >
      <div>
        <p className="eyebrow">Forgot Password</p>
        <h1 className="page-title mt-2">Recover account access</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--foreground)]/72">
          Request a password reset OTP, then submit your new password securely.
        </p>
      </div>

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

      {step === "reset" ? (
        <>
          <label className="grid gap-2 text-sm font-medium">
            OTP
            <input
              required
              inputMode="numeric"
              maxLength={6}
              value={form.otp}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  otp: event.target.value.replace(/\D/g, "").slice(0, 6),
                }))
              }
              className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none"
              placeholder="6-digit code"
            />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            New Password
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
        </>
      ) : null}

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
            reset the password locally.
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

      <div className="flex items-center justify-between gap-3">
        <Link href="/login" className="text-sm font-semibold text-sky-400">
          Back to Login
        </Link>
        <Link href="/signup" className="text-sm font-semibold text-emerald-400">
          Create Account
        </Link>
      </div>

      <Button type="submit" size="lg" disabled={loading}>
        {loading
          ? step === "email"
            ? "Sending OTP..."
            : "Resetting..."
          : step === "email"
            ? "Send Reset OTP"
            : "Reset Password"}
      </Button>
    </form>
  );
}
