import type { Metadata, Viewport } from "next";
import "@/styles/globals.scss";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "MediKiosk", template: "%s | MediKiosk" },
  description: "AI-powered patient intake and hospital queue optimisation.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0B67F3",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>{children}</body>
    </html>
  );
}
