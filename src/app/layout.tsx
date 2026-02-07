import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AuthGuard } from "@/components/AuthGuard";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bud — AI Mood Playlist Generator",
  description:
    "Tell Bud how you feel and get a playlist that actually gets it. Always free.",
  themeColor: "#0b0f1a",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} antialiased`}>
        <div className="relative min-h-screen bg-grid text-[var(--text)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[380px] bg-[radial-gradient(circle_at_top,rgba(99,91,255,0.18),transparent_60%)]" />
          <Providers>
            <AuthGuard>
              {children}
            </AuthGuard></Providers>
        </div>
      </body>
    </html>
  );
}
