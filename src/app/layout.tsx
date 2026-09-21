import "./globals.css";
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@next/third-parties/google";
import { GA_PATH_REDACTION_SCRIPT } from "@/lib/analytics/normalize-path";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const interVariable = localFont({
  variable: "--font-inter-variable",
  src: [
    {
      path: "../../public/font/Inter/InterVariable.woff2",
      style: "normal",
    },
    {
      path: "../../public/font/Inter/InterVariable-Italic.woff2",
      style: "italic",
    },
  ],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Interaction Mining",
  description:
    "Interaction Mining - A platform for capturing, analyzing, and understanding user interactions with mobile applications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="en">
        <head>
          {/*
            Must run before <GoogleAnalytics> initialises: that component emits
            a bare gtag('config', id), which immediately sends a page_view using
            the raw URL. Seeding the same dataLayer queue with a redacted
            page_location first keeps record ids from reaching Google.

            A plain inline script in <head> rather than next/script: it executes
            during parse, and GoogleAnalytics's own scripts default to
            afterInteractive, so ordering is guaranteed. `beforeInteractive`
            renders a real tag in place, which React rejects outside <head>.
          */}
          {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
            <script
              dangerouslySetInnerHTML={{ __html: GA_PATH_REDACTION_SCRIPT }}
            />
          )}
        </head>
        <body
          className={cn(
            inter.variable,
            interVariable.variable,
            geistMono.variable,
            "relative flex min-h-dvh min-w-dvw grow flex-col scroll-smooth! font-sans",
          )}
        >
          <Toaster />
          {children}
        </body>
        {/* Feature Flag: Google Analytics */}
        {process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID} />
        )}
      </html>
    </SessionProvider>
  );
}
