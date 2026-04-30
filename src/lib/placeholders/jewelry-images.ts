const jewelryPlaceholderBasePath = "/images/placeholders/jewelry";

export type JewelryPlaceholderImage = {
  src: string;
  alt: string;
  title?: string;
  styleLabel?: string;
};

const image = (
  fileName: string,
  metadata: Omit<JewelryPlaceholderImage, "src">,
): JewelryPlaceholderImage => ({
  src: `${jewelryPlaceholderBasePath}/${fileName}`,
  ...metadata,
});

export const homeHero = image("home-hero.webp", {
  alt: "تصویر نمونه عکاسی استودیویی از جواهر طلا",
  title: "استودیوی هوشمند طلا",
});

export const uploadPreview = image("upload-preview.webp", {
  alt: "پیش‌نمایش نمونه تصویر جواهر برای بارگذاری",
  title: "پیش‌نمایش بارگذاری",
});

export const resultHeroDark = image("result-hero-dark.webp", {
  alt: "نمونه خروجی لوکس جواهر روی پس‌زمینه تیره",
  title: "نتیجه نهایی",
  styleLabel: "استودیوی تیره",
});

export const stylePresets = [
  image("style-minimal.webp", {
    alt: "نمونه سبک مینیمال برای عکاسی جواهر",
    title: "مینیمال",
    styleLabel: "مینیمال روشن",
  }),
  image("style-dark.webp", {
    alt: "نمونه سبک تیره برای عکاسی جواهر",
    title: "تیره",
    styleLabel: "پس‌زمینه تیره",
  }),
  image("style-editorial.webp", {
    alt: "نمونه سبک ادیتوریال برای کمپین جواهر",
    title: "ادیتوریال",
    styleLabel: "مجله‌ای",
  }),
  image("style-natural.webp", {
    alt: "نمونه سبک طبیعی برای عکاسی جواهر",
    title: "طبیعی",
    styleLabel: "نور طبیعی",
  }),
  image("style-gold.webp", {
    alt: "نمونه سبک طلایی برای عکاسی جواهر",
    title: "طلایی",
    styleLabel: "درخشش طلا",
  }),
];

export const archiveItems = [
  image("archive-01.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره یک",
    title: "نمونه آرشیو ۱",
  }),
  image("archive-02.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره دو",
    title: "نمونه آرشیو ۲",
  }),
  image("archive-03.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره سه",
    title: "نمونه آرشیو ۳",
  }),
  image("archive-04.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره چهار",
    title: "نمونه آرشیو ۴",
  }),
  image("archive-05.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره پنج",
    title: "نمونه آرشیو ۵",
  }),
  image("archive-06.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره شش",
    title: "نمونه آرشیو ۶",
  }),
  image("archive-07.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره هفت",
    title: "نمونه آرشیو ۷",
  }),
  image("archive-08.webp", {
    alt: "نمونه تصویر آرشیو جواهر شماره هشت",
    title: "نمونه آرشیو ۸",
  }),
];

export const extras = [
  image("jewelry-extra-01.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره یک",
    title: "نمونه تکمیلی ۱",
  }),
  image("jewelry-extra-02.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره دو",
    title: "نمونه تکمیلی ۲",
  }),
  image("jewelry-extra-03.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره سه",
    title: "نمونه تکمیلی ۳",
  }),
  image("jewelry-extra-04.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره چهار",
    title: "نمونه تکمیلی ۴",
  }),
  image("jewelry-extra-05.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره پنج",
    title: "نمونه تکمیلی ۵",
  }),
  image("jewelry-extra-06.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره شش",
    title: "نمونه تکمیلی ۶",
  }),
  image("jewelry-extra-07.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره هفت",
    title: "نمونه تکمیلی ۷",
  }),
  image("jewelry-extra-08.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره هشت",
    title: "نمونه تکمیلی ۸",
  }),
  image("jewelry-extra-09.webp", {
    alt: "نمونه تکمیلی تصویر جواهر شماره نه",
    title: "نمونه تکمیلی ۹",
  }),
];

export const jewelryPlaceholderImages = {
  homeHero,
  uploadPreview,
  resultHeroDark,
  stylePresets,
  archiveItems,
  extras,
};

export const jewelryPlaceholderImageCount =
  1 +
  1 +
  1 +
  stylePresets.length +
  archiveItems.length +
  extras.length;
