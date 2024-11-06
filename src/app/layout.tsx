import "./globals.css";
import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";

import classNames from "classnames";
import NavigationBar from "@/components/navigation-bar";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
});

const inter = localFont({
  src: "../../public/font/Inter4/InterVariable.woff2",
  display: "swap",
  weight: "100 900",
  variable: "--font-inter",
});

const interDisplay = localFont({
  src: [
    {
      path: "../../public/font/Inter4/InterDisplay-Thin.woff2",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-ThinItalic.woff2",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-ExtraLightItalic.woff2",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-LightItalic.woff2",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-MediumItalic.woff2",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-SemiBoldItalic.woff2",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-ExtraBoldItalic.woff2",
      weight: "800",
      style: "italic",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-Black.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../public/font/Inter4/InterDisplay-BlackItalic.woff2",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-inter-display",
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
    <html lang="en">
      <body
        className={classNames(
          mona.variable,
          inter.variable,
          interDisplay.variable,
          robotoMono.variable,
          "relative flex flex-col grow min-w-dvw min-h-dvh scroll-smooth font-sans text-black"
        )}
      >
        {children}
      </body>
    </html>
  );
}
