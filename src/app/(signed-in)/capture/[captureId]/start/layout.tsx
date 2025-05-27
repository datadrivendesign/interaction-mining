import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Capture",
};

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
