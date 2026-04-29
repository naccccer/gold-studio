import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: "../../public/fonts/Vazirmatn[wght].woff2",
  variable: "--font-vazirmatn",
  display: "swap",
});

const doran = localFont({
  src: [
    { path: "../../public/fonts/Doran-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Doran-Bold.woff2", weight: "700", style: "normal" },
  ],
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
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${doran.variable} h-full`}>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
