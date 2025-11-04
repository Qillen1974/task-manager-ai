import type { Metadata } from "next";
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

// Initialize recurring task scheduler on server startup
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SCHEDULER === 'true') {
  startRecurringTaskScheduler();
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
