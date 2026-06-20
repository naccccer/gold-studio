const jewelryPlaceholderBasePath = "/images/placeholders/jewelry";
const sampleReferenceBasePath = "/images/Samples";

export type JewelryPlaceholderImage = {
  src: string;
  alt: string;
  id?: string;
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

const sampleReference = (
  fileName: string,
  metadata: Omit<JewelryPlaceholderImage, "src">,
): JewelryPlaceholderImage => ({
  src: `${sampleReferenceBasePath}/${fileName}`,
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

export const styleSamples = [
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

export const styleReferenceSamples = [
  sampleReference("bw-ring-woman.webp", {
    id: "bw-ring-woman",
    alt: "نمونه عکس انگشتر روی دست با فضای سیاه‌وسفید",
    title: "انگشتر روی دست",
  }),
  sampleReference("c0fb4190cd96c9391b843c31fac66b86.webp", {
    id: "soft-ring-light",
    alt: "نمونه عکس محصول جواهر با نور نرم و پس‌زمینه روشن",
    title: "نور نرم",
  }),
  sampleReference("Hand-Ring-under-water.webp", {
    id: "hand-ring-under-water",
    alt: "نمونه عکس انگشتر روی دست زیر آب",
    title: "انگشتر زیر آب",
  }),
  sampleReference("hand-ring-woman.webp", {
    id: "hand-ring-woman",
    alt: "نمونه عکس انگشتر روی دست با مدل زن",
    title: "دست و انگشتر",
  }),
  sampleReference("man-hand.webp", {
    id: "man-hand",
    alt: "نمونه عکس اکسسوری روی دست مردانه",
    title: "دست مردانه",
  }),
  sampleReference("man-ring-hand.webp", {
    id: "man-ring-hand",
    alt: "نمونه عکس انگشتر مردانه روی دست",
    title: "انگشتر مردانه",
  }),
  sampleReference("man-ring-hand-formal.webp", {
    id: "man-ring-hand-formal",
    alt: "نمونه عکس رسمی انگشتر مردانه",
    title: "رسمی مردانه",
  }),
  sampleReference("Model-earing-hand.webp", {
    id: "model-earing-hand",
    alt: "نمونه عکس گوشواره با مدل و دست",
    title: "گوشواره با مدل",
  }),
  sampleReference("Model-ring-hand.webp", {
    id: "model-ring-hand",
    alt: "نمونه عکس انگشتر با مدل دست",
    title: "مدل دست",
  }),
  sampleReference("neckless-editorial-wooddecor.webp", {
    id: "neckless-editorial-wooddecor",
    alt: "نمونه عکس ادیتوریال گردنبند با دکور چوبی",
    title: "گردنبند و دکور",
  }),
  sampleReference("Ring-Redbg.webp", {
    id: "ring-redbg",
    alt: "نمونه عکس انگشتر روی پس‌زمینه قرمز",
    title: "پس‌زمینه قرمز",
  }),
  sampleReference("shadow.webp", {
    id: "shadow",
    alt: "نمونه عکس جواهر با سایه نرم",
    title: "سایه نرم",
  }),
  sampleReference("wood-ring.webp", {
    id: "wood-ring",
    alt: "نمونه عکس انگشتر با بافت چوبی",
    title: "انگشتر و چوب",
  }),
];

export const jewelryPlaceholderImages = {
  homeHero,
  uploadPreview,
  resultHeroDark,
  styleSamples,
  styleReferenceSamples,
  archiveItems,
  extras,
};

export const jewelryPlaceholderImageCount =
  1 +
  1 +
  1 +
  styleSamples.length +
  styleReferenceSamples.length +
  archiveItems.length +
  extras.length;
