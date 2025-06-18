import "./globals.css";
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { SessionProvider } from "next-auth/react";

import { Toaster } from "@/components/ui/sonner";
import classNames from "classnames";
import { SessionProvider } from "next-auth/react";
import Configuration from "../components/configuration";
import { cn } from "@/lib/utils";

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
    }
  ],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ODIM",
  description: "ODIM Project ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Configuration>
      <SessionProvider>
        <html lang="en">
          <body
            className={cn(
              inter.variable,
              interVariable.variable,
              geistMono.variable,
              "relative flex flex-col grow min-w-dvw min-h-dvh scroll-smooth! font-sans"
            )}
          >
            <Toaster />
            {children}
          </body>
        </html>
      </SessionProvider>
    </Configuration>
  );
}
