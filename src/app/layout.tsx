// src/app/layout.tsx (또는 RootLayout.tsx)

import "./globals.css";
import { Toaster } from "sonner";

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
