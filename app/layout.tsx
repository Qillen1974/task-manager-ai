import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { startRecurringTaskScheduler } from "@/lib/scheduler";
import PWAProvider from "@/components/PWAProvider";
import { JsonLd, organizationSchema } from "@/components/JsonLd";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "TaskQuadrant - Task Management with Eisenhower Matrix",
  description: "Manage your tasks with the Eisenhower Matrix - Prioritize by urgency and importance. Free task management tool for individuals and teams.",
  keywords: "task management, Eisenhower Matrix, productivity, prioritization, project management, time management",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TaskQuadrant",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  openGraph: {
    title: "TaskQuadrant - Professional Task Management",
    description: "Manage your tasks with the Eisenhower Matrix - Prioritize by urgency and importance",
    type: "website",
    url: "https://taskquadrant.io",
    images: [
      {
        url: "https://taskquadrant.io/og-image.png",
        width: 1200,
        height: 630,
        alt: "TaskQuadrant - Eisenhower Matrix Task Management",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TaskQuadrant - Task Management",
    description: "Manage your tasks with the Eisenhower Matrix",
  },
  metadataBase: new URL("https://taskquadrant.io"),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  viewportFit: "cover",
};

// Initialize recurring task scheduler on server startup (not during build)
// Skip scheduler during Next.js build phase to avoid DATABASE_URL errors
if ((process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') &&
    process.env.NEXT_PHASE !== 'phase-production-build') {
  startRecurringTaskScheduler();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="TaskQuadrant" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/* JSON-LD Structured Data */}
        <JsonLd data={organizationSchema} />

        {/* Google Ads Conversion Tracking */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-1024096280"
          strategy="afterInteractive"
        />
        <Script
          id="google-ads-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-1024096280');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAProvider>{children}</PWAProvider>
      </body>
    </html>
  );
}
