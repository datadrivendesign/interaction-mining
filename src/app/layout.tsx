import "./globals.css";
import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import classNames from "classnames";
import Configuration from "./components/configuration";
import { SessionProvider } from "next-auth/react";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

const inter = Inter({
  subsets: ["latin-ext"],
  variable: "--font-inter",
});

const mona = localFont({
  src: "../../public/font/Mona/Mona-Sans.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-mona",
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
            className={classNames(
              mona.variable,
              inter.variable,
              robotoMono.variable,
              "relative flex flex-col grow min-w-dvw min-h-dvh scroll-smooth font-sans text-foreground bg-background "
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
