import "./globals.css";
import { Providers } from "@/components/providers";
import Navbar from "@/components/layout/navbar";

export const metadata = {
  title: "TradeReplica",
  description:
    "Professional copy trading platform for Indian stocks, forex, and crypto.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--background)] font-body text-[var(--foreground)] antialiased">
        <Providers>
          <div className="relative min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_30%),radial-gradient(circle_at_right,rgba(59,130,246,0.18),transparent_22%)]" />
            <div className="absolute inset-0 bg-grid bg-[size:24px_24px] opacity-25" />
            <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-10 sm:px-6 lg:px-8">
              <Navbar />
              <main className="flex-1 pt-6">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

