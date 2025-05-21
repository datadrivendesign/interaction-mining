// import NavigationBar from "./components/navigation-bar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* <NavigationBar /> */}
      {children}
    </>
  );
}
