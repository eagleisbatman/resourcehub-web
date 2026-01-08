import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { runStartupMigrations } from "@/lib/db/startup";

// Run migrations at startup (only in production/server)
if (process.env.NODE_ENV === "production" && typeof window === "undefined") {
  runStartupMigrations().catch(console.error);
}

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
  title: "ResourceHub - Digital Green Foundation",
  description: "Internal resource tracking and management system",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

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
