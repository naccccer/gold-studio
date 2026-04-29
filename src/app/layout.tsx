import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const lahzeFallback = localFont({
  src: "../../public/fonts/Vazirmatn[wght].woff2",
  variable: "--font-lahze",
  display: "swap",
});

const doranFallback = localFont({
  src: "../../public/fonts/Vazirmatn[wght].woff2",
  variable: "--font-doran",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gold Studio",
  description: "استودیوی هوشمند ساخت تصاویر حرفه‌ای محصول",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${lahzeFallback.variable} ${doranFallback.variable} h-full`}>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
