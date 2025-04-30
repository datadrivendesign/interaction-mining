"use client";

import { SessionProvider } from "next-auth/react";
import NavigationBar from "@/components/navigation-bar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider><NavigationBar />{children}</SessionProvider>;
}
