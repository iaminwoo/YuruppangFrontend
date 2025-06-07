import "./globals.css";
import localFont from "next/font/local";
import { Toaster } from "sonner";

const suit = localFont({
  src: [
    {
      path: "/fonts/SUIT-Regular.ttf",
      weight: "400",
    },
    {
      path: "/fonts/SUIT-Bold.ttf",
      weight: "700",
    },
  ],
  variable: "--font-suit",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={`${suit.variable} font-sans`}>
      <body>
        {children} <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
