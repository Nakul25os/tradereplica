"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle,
  CreditCard,
  Landmark,
  QrCode,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useAuth } from "@/components/providers";
import { apiRequest } from "@/lib/api";
import { currency, formatDateTime, number } from "@/lib/formatters";
import AuthRequiredPanel from "@/components/account/auth-required-panel";
import Button from "@/components/ui/button";

const fundingMethods = [
  {
    id: "bank_transfer",
    title: "Bank Transfer",
    icon: Landmark,
    description: "Settle larger INR transfers into your trading ledger with a bank reference trail.",
    detail: "Operational: ledger credit posts instantly after submission",
  },
  {
    id: "upi_qr",
    title: "UPI / QR",
    icon: QrCode,
    description: "Push retail-sized INR deposits with UPI details and instant wallet credit.",
    detail: "Operational: instant retail funding rail",
  },
  {
    id: "card",
    title: "Card Funding",
    icon: CreditCard,
    description: "Fund the account with a card payment flow while storing only masked card details.",
    detail: "Operational: masked card settlement",
  },
];

const initialFormState = {
  amountInr: "5000",
  accountHolderName: "",
  bankReference: "",
  upiId: "",
  cardNumber: "",
  expiry: "",
  cvv: "",
};

export default function DepositScreen() {
  const router = useRouter();
  const { authenticated, loading: authLoading, token, logout, refreshUser } = useAuth();
  const [walletState, setWalletState] = useState({
    wallet: null,
    transactions: [],
  });
  const [selectedMethod, setSelectedMethod] = useState("bank_transfer");
  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!authenticated || !token) {
      setLoading(false);
      setWalletState({
        wallet: null,
        transactions: [],
      });
      return;
    }

    let active = true;

    const loadWallet = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiRequest("/wallet", { token });

        if (!active) {
          return;
        }

        setWalletState(response);
      } catch (nextError) {
        if (!active) {
          return;
        }

        if (nextError.status === 401) {
          logout();
          router.push("/login");
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
  }, [authenticated, logout, router, token]);

  const wallet = walletState.wallet;
  const selectedFundingMethod =
    fundingMethods.find((method) => method.id === selectedMethod) || fundingMethods[0];
  const estimatedUsdt = useMemo(() => {
    const amountInr = Number(form.amountInr || 0);

    if (!wallet?.fxRateInrPerUsdt || !Number.isFinite(amountInr) || amountInr <= 0) {
      return 0;
    }

    return amountInr / wallet.fxRateInrPerUsdt;
  }, [form.amountInr, wallet?.fxRateInrPerUsdt]);

  const updateField = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetMethodFields = (method) => {
    setForm((current) => ({
      amountInr: current.amountInr,
      accountHolderName: current.accountHolderName,
      bankReference: method === "bank_transfer" ? current.bankReference : "",
      upiId: method === "upi_qr" ? current.upiId : "",
      cardNumber: "",
      expiry: "",
      cvv: "",
    }));
  };

  const handleMethodChange = (method) => {
    setSelectedMethod(method);
    setMessage("");
    setError("");
    resetMethodFields(method);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      router.push("/login");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await apiRequest("/wallet/deposits", {
        method: "POST",
        token,
        body: {
          method: selectedMethod,
          amountInr: Number(form.amountInr),
          accountHolderName: form.accountHolderName,
          bankReference: form.bankReference,
          upiId: form.upiId,
          cardNumber: form.cardNumber,
          expiry: form.expiry,
          cvv: form.cvv,
        },
      });

      setWalletState({
        wallet: response.wallet,
        transactions: response.transactions,
      });
      setMessage(response.message);
      setForm((current) => ({
        ...initialFormState,
        amountInr: current.amountInr,
        accountHolderName: current.accountHolderName,
      }));
      await refreshUser();
    } catch (nextError) {
      if (nextError.status === 401) {
        logout();
        router.push("/login");
        return;
      }

      setError(nextError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="grid gap-6">
        <div className="panel h-44 animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="panel h-56 animate-pulse" />
          <div className="panel h-56 animate-pulse" />
          <div className="panel h-56 animate-pulse" />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
          <div className="panel h-[520px] animate-pulse" />
          <div className="panel h-[520px] animate-pulse" />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <AuthRequiredPanel
        title="Open your TradeReplica deposit desk"
        description="Sign in to access bank transfer, UPI, and card funding for your trading wallet."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <section className="panel-strong p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="eyebrow">Deposit</p>
            <h1 className="page-title mt-2">Funding desk and settlement controls</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--foreground)]/76">
              Choose a funding rail, submit the settlement details, and credit INR into your
              USDT trading balance without leaving the platform.
            </p>
          </div>
          <div className="soft-panel grid gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-400">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">Wallet Snapshot</p>
                <p className="muted text-sm">
                  {wallet?.fxRateInrPerUsdt ? `1 USDT = ₹${number(wallet.fxRateInrPerUsdt, 2)}` : "Funding rate ready"}
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SnapshotMetric label="Total Margin" value={`${number(wallet?.marginBalance, 2)} USDT`} />
              <SnapshotMetric label="Available" value={`${number(wallet?.availableBalance, 2)} USDT`} />
              <SnapshotMetric label="Locked in Live Copy" value={`${number(wallet?.copyLockedBalance, 2)} USDT`} />
              <SnapshotMetric label="Total Deposited" value={`${number(wallet?.totalDeposited, 2)} USDT`} />
            </div>
            <p className="muted text-sm">
              Last funding activity: {wallet?.lastFundingAt ? formatDateTime(wallet.lastFundingAt) : "No deposits yet"}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/wallet" variant="outline">
                Open Wallet
              </Button>
              <Button href="/#trader-discovery" variant="ghost">
                Review Traders
              </Button>
            </div>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {fundingMethods.map((method) => (
          <FundingCard
            key={method.id}
            {...method}
            active={selectedMethod === method.id}
            onClick={() => handleMethodChange(method.id)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.92fr]">
        <form onSubmit={handleSubmit} className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Settlement Form</p>
              <h2 className="section-title mt-2">{selectedFundingMethod.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/74">
                {selectedFundingMethod.description}
              </p>
            </div>
            <ArrowDownCircle className="h-6 w-6 text-sky-400" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field
              label="Account Holder Name"
              value={form.accountHolderName}
              onChange={(event) => updateField("accountHolderName", event.target.value)}
              placeholder="Enter the payer name"
            />
            <Field
              label="Amount (INR)"
              type="number"
              min="500"
              step="100"
              value={form.amountInr}
              onChange={(event) => updateField("amountInr", event.target.value)}
              placeholder="5000"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[1000, 5000, 10000, 25000].map((amount) => (
              <button
                key={amount}
                type="button"
                className="rounded-full border border-[var(--border)] px-3 py-2 text-sm font-semibold transition hover:bg-white/10"
                onClick={() => updateField("amountInr", String(amount))}
              >
                {currency(amount, "INR")}
              </button>
            ))}
          </div>

          {selectedMethod === "bank_transfer" ? (
            <div className="mt-6">
              <Field
                label="Bank Reference Number"
                value={form.bankReference}
                onChange={(event) => updateField("bankReference", event.target.value.toUpperCase())}
                placeholder="UTR / IMPS / NEFT reference"
              />
            </div>
          ) : null}

          {selectedMethod === "upi_qr" ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field
                label="Your UPI ID"
                value={form.upiId}
                onChange={(event) => updateField("upiId", event.target.value)}
                placeholder="name@bank"
              />
              <div className="soft-panel p-4">
                <p className="muted text-xs uppercase tracking-[0.2em]">Pay To</p>
                <p className="mt-2 font-semibold">tradereplica@ledger</p>
                <p className="muted mt-2 text-sm">
                  Use the UPI ID above to record the incoming funding leg.
                </p>
              </div>
            </div>
          ) : null}

          {selectedMethod === "card" ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Field
                label="Card Number"
                value={form.cardNumber}
                onChange={(event) => updateField("cardNumber", event.target.value.replace(/[^\d]/g, ""))}
                placeholder="4111111111111111"
                inputMode="numeric"
              />
              <Field
                label="Expiry"
                value={form.expiry}
                onChange={(event) => updateField("expiry", event.target.value.toUpperCase())}
                placeholder="MM/YY"
              />
              <Field
                label="CVV"
                value={form.cvv}
                onChange={(event) => updateField("cvv", event.target.value.replace(/[^\d]/g, ""))}
                placeholder="123"
                inputMode="numeric"
              />
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="soft-panel p-4">
              <p className="muted text-xs uppercase tracking-[0.2em]">Estimated Credit</p>
              <p className="mt-3 text-2xl font-semibold text-emerald-400">
                {number(estimatedUsdt, 2)} USDT
              </p>
              <p className="muted mt-2 text-sm">
                Converted using the active desk rate of ₹{number(wallet?.fxRateInrPerUsdt, 2)} per USDT.
              </p>
            </div>
            <div className="soft-panel p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-1 h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-semibold">Ledger protection</p>
                  <p className="muted mt-2 text-sm leading-6">
                    Card numbers are masked after submission, bank references are retained for audit,
                    and every deposit writes a transaction record before the UI refreshes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Processing..." : `Credit via ${selectedFundingMethod.title}`}
            </Button>
            <Button type="button" variant="outline" size="lg" onClick={() => setForm(initialFormState)}>
              Reset Form
            </Button>
          </div>
        </form>

        <section className="panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Recent Ledger</p>
              <h2 className="section-title mt-2">Funding and allocation history</h2>
            </div>
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
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
                        {transaction.amountInr ? currency(transaction.amountInr, "INR") : transaction.typeLabel}
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
                      <p className="mt-1 font-semibold">{number(transaction.balanceAfter, 2)} USDT</p>
                    </div>
                    <div>
                      <p className="muted">Counterparty</p>
                      <p className="mt-1 font-semibold">{transaction.counterparty || "-"}</p>
                    </div>
                    <div>
                      <p className="muted">Timestamp</p>
                      <p className="mt-1 font-semibold">{formatDateTime(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <p className="muted mt-3 text-sm">{transaction.note}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-12 text-center text-sm text-[var(--foreground)]/70">
                No deposits yet. Submit a funding form to start your wallet ledger.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}

function FundingCard({ active, description, detail, icon: Icon, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`panel p-5 text-left transition ${
        active ? "border-emerald-400 bg-emerald-500/10" : "hover:-translate-y-0.5"
      }`}
    >
      <div className="w-fit rounded-2xl bg-emerald-500/15 p-3 text-emerald-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--foreground)]/76">
        {description}
      </p>
      <p className="mt-4 text-sm font-semibold text-sky-300">{detail}</p>
    </button>
  );
}

function SnapshotMetric({ label, value }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] px-4 py-3">
      <p className="muted text-xs uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold">{label}</span>
      <input
        {...props}
        className="h-12 rounded-2xl border border-[var(--border)] bg-transparent px-4 outline-none transition focus:border-emerald-400"
      />
    </label>
  );
}
