import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import "./globals.css";
import { startRecurringTaskScheduler } from "@/lib/scheduler";

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
  title: "TaskQuadrant - Professional Task Management",
  description: "Manage your tasks with the Eisenhower Matrix - Prioritize by urgency and importance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
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
        {children}
      </body>
    </html>
  );
}
