import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Capture",
  other: {
    "apple-itunes-app": "app-id=389801252, app-argument=myURL",
  },
};

// <meta name="apple-itunes-app" content="app-id=myAppStoreID, app-argument=myURL">

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
