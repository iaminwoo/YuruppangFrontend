// src/app/layout.tsx

import "./globals.css";
import { Toaster } from "sonner";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "유루빵 | 제과제빵 관리 서비스",
  description: "유루디아를 위한 제과제빵 웹 서비스",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    themeColor: "#ffffff",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className="font-sans">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
