import NavigationBar from "@/components/navigation-bar";
import { Suspense } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <NavigationBar />
      <Suspense>{children}</Suspense>
    </>
  );
}
