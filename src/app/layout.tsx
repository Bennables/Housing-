import type { Metadata } from "next";
import { Schibsted_Grotesk, Spline_Sans_Mono, Young_Serif } from "next/font/google";
import { Disclaimer } from "@/components/disclaimer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });
const splineMono = Spline_Sans_Mono({ variable: "--font-spline-mono", subsets: ["latin"] });
const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: "Closing the Gap", template: "%s | Closing the Gap" },
  description:
    "Find government programs and funding, from SNAP and Medi-Cal to grants for builders, and see how the money closes the housing gap.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${schibsted.variable} ${splineMono.variable} ${youngSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <footer className="border-t bg-card">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <Disclaimer />
          </div>
        </footer>
      </body>
    </html>
  );
}
