import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ovala",
    short_name: "Ovala",
    description: "استودیوی هوشمند ساخت تصاویر حرفه‌ای محصول و جواهرات",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8f5ef",
    theme_color: "#14110d",
    dir: "rtl",
    lang: "fa",
    icons: [
      {
        src: "/brand/ovala-app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/ovala-app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/brand/ovala-app-icon.preview.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/ovala-app-icon.preview.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
