import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const vazirmatn = localFont({
  src: [
    { path: "../../public/fonts/Vazir-Thin-FD.woff2", weight: "100", style: "normal" },
    { path: "../../public/fonts/Vazir-Light-FD.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/Vazir-Regular-FD.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/Vazir-Medium-FD.woff2", weight: "500", style: "normal" },
    { path: "../../public/fonts/Vazir-Bold-FD.woff2", weight: "700", style: "normal" },
    { path: "../../public/fonts/Vazir-Black-FD.woff2", weight: "900", style: "normal" },
  ],
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
  title: "Ovala",
  description: "استودیوی هوشمند ساخت تصاویر حرفه‌ای محصول و جواهرات",
  applicationName: "Ovala",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/ovala-app-icon.svg", type: "image/svg+xml" },
      { url: "/brand/ovala-app-icon.preview.png", type: "image/png" },
    ],
    shortcut: [{ url: "/brand/ovala-app-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/ovala-app-icon.preview.png", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#14110d",
};

const verticalBootstrapScript = `
(() => {
  const host = window.location.hostname.toLowerCase();
  const cookie = document.cookie.split("; ").find((item) => item.startsWith("ovala_local_vertical="));
  const localVertical = cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : "";
  const vertical = host === "food" || host.startsWith("food.") ? "food" : localVertical;
  if (vertical === "food" || vertical === "jewelry") {
    document.documentElement.dataset.vertical = vertical;
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} ${doran.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: verticalBootstrapScript }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}
