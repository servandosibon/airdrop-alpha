import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Airdrop Alpha — Find the airdrops worth your time",
  description:
    "We analyze crypto airdrop opportunities and rank them by expected value, cost, time, risk and probability of reward.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body bg-ink-900 text-paper-100 antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-ink-600 py-8 mt-16">
          <div className="max-w-6xl mx-auto px-6 text-xs text-paper-500 leading-relaxed">
            Airdrop Alpha provides informational and analytical estimates based on publicly available data.
            Scores and reward estimates are uncertain and do not constitute financial or investment advice.
            Users should independently assess risks before interacting with any protocol.
          </div>
        </footer>
      </body>
    </html>
  );
}
