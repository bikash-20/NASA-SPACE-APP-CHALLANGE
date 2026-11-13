import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MotionConfig } from "framer-motion";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallBanner } from "@/components/InstallBanner";
import { I18nProvider } from "@/lib/i18nContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crew Health Monitor",
  description:
    "Mission-control dashboard for crew telemetry, rule-based alerts, and an LLM flight surgeon brief.",
  manifest: "/manifest.webmanifest",
  applicationName: "Crew Health Monitor",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Crew Monitor",
  },
  icons: {
    icon: [
      { url: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070d17",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans bg-bg-deep text-ink antialiased`}
        style={{ lineHeight: "var(--lh-body)" }}
      >
        <MotionConfig reducedMotion="user">
          <I18nProvider>
            <ServiceWorkerRegistration />
            <InstallBanner />
            {children}
          </I18nProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
