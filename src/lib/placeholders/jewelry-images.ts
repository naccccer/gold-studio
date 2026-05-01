function createDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildJewelryScene({
  background,
  ring,
  accent,
  surface,
  label,
  subtitle,
}: {
  background: string;
  ring: string;
  accent: string;
  surface: string;
  label: string;
  subtitle: string;
}) {
  return createDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="55%" stop-color="#120f10" />
          <stop offset="100%" stop-color="#040404" />
        </linearGradient>
        <radialGradient id="spot" cx="50%" cy="38%" r="44%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.9" />
          <stop offset="55%" stop-color="${accent}" stop-opacity="0.18" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="band" x1="0%" y1="10%" x2="100%" y2="90%">
          <stop offset="0%" stop-color="${ring}" />
          <stop offset="50%" stop-color="#f7e2b4" />
          <stop offset="100%" stop-color="#8b6730" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1500" fill="url(#bg)" />
      <rect width="1200" height="1500" fill="url(#spot)" opacity="0.95" />
      <ellipse cx="600" cy="1170" rx="350" ry="90" fill="${surface}" opacity="0.36" />
      <ellipse cx="600" cy="1070" rx="182" ry="248" fill="none" stroke="url(#band)" stroke-width="46" />
      <ellipse cx="600" cy="875" rx="122" ry="118" fill="#101010" opacity="0.44" />
      <path d="M600 650 L648 760 L770 777 L680 856 L703 980 L600 918 L497 980 L520 856 L430 777 L552 760 Z"
        fill="#fff4cf" opacity="0.97" />
      <circle cx="600" cy="796" r="48" fill="#ffffff" opacity="0.92" />
      <circle cx="452" cy="732" r="9" fill="#fff8de" opacity="0.72" />
      <circle cx="756" cy="700" r="11" fill="#fff8de" opacity="0.64" />
      <circle cx="720" cy="955" r="8" fill="#fff8de" opacity="0.44" />
      <text x="600" y="1290" fill="#f4ead7" font-family="Vazirmatn, Tahoma, sans-serif" font-size="54" text-anchor="middle">${label}</text>
      <text x="600" y="1360" fill="#cdbfa5" font-family="Vazirmatn, Tahoma, sans-serif" font-size="28" text-anchor="middle">${subtitle}</text>
    </svg>
  `);
}

function buildSourcePreview() {
  return createDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4a372b" />
          <stop offset="100%" stop-color="#161311" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1500" fill="url(#bg)" />
      <rect x="120" y="140" width="960" height="1220" rx="64" fill="#241f1d" stroke="#6d5540" stroke-opacity="0.46" />
      <ellipse cx="600" cy="1140" rx="264" ry="74" fill="#0f0d0c" opacity="0.48" />
      <ellipse cx="600" cy="1025" rx="142" ry="196" fill="none" stroke="#b18a56" stroke-width="30" opacity="0.88" />
      <circle cx="600" cy="792" r="62" fill="#f4e2b4" opacity="0.82" />
      <path d="M600 700 L620 752 L674 756 L633 792 L646 846 L600 816 L554 846 L567 792 L526 756 L580 752 Z"
        fill="#fff2cc" opacity="0.82" />
      <text x="600" y="1298" fill="#efe4cf" font-family="Vazirmatn, Tahoma, sans-serif" font-size="42" text-anchor="middle">ورودی کاربر</text>
      <text x="600" y="1350" fill="#bfa98b" font-family="Vazirmatn, Tahoma, sans-serif" font-size="24" text-anchor="middle">نور معمولی و ثبت اولیه</text>
    </svg>
  `);
}

export const resultHeroDark = buildJewelryScene({
  background: "#1d1717",
  ring: "#d7a24d",
  accent: "#f0d5a0",
  surface: "#efd3a7",
  label: "خروجی نهایی",
  subtitle: "جلوه استودیویی با کنتراست عمیق",
});

export const completedResult = buildJewelryScene({
  background: "#241c1c",
  ring: "#cf9440",
  accent: "#e6c187",
  surface: "#dfc08f",
  label: "نسخه آماده دانلود",
  subtitle: "فریم ادیتوریال برای ویترین و شبکه اجتماعی",
});

export const pendingResult = buildJewelryScene({
  background: "#191919",
  ring: "#9b835b",
  accent: "#d7c49d",
  surface: "#c4ad83",
  label: "در حال آماده‌سازی",
  subtitle: "نور، بافت و انعکاس‌ها در حال نهایی شدن هستند",
});

export const failedResult = buildJewelryScene({
  background: "#1f1716",
  ring: "#a77449",
  accent: "#dcb48d",
  surface: "#ae8e67",
  label: "نیاز به بازبینی",
  subtitle: "یک تلاش دیگر با ورودی بهتر می‌تواند نتیجه را ارتقا بدهد",
});

export const uploadPreview = buildSourcePreview();

export const jewelryImageRegistry = {
  completedResult,
  failedResult,
  pendingResult,
  resultHeroDark,
  uploadPreview,
};

