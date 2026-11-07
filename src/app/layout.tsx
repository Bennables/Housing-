import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Disclaimer } from "@/components/disclaimer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Closing the Gap", template: "%s | Closing the Gap" },
  description:
    "Find government programs and funding, from SNAP and Medi-Cal to grants for builders, and see how the money closes the housing gap.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
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
