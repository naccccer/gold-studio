import { db } from "@/lib/db";
import { foodPlaceholderImages } from "@/lib/placeholders/food-images";
import { homeHero, styleSamples } from "@/lib/placeholders/jewelry-images";
import { storageThumbnailUrlFromKeyOrUrl } from "@/lib/storage";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

export type HomeCarouselImage = {
  src: string;
  alt: string;
  beforeSrc?: string;
  beforeAlt?: string;
};

export function fallbackHomeCarouselImages(): HomeCarouselImage[] {
  return [
    { src: homeHero.src, alt: homeHero.alt, beforeSrc: styleSamples[1]?.src, beforeAlt: styleSamples[1]?.alt },
    { src: styleSamples[0].src, alt: styleSamples[0].alt, beforeSrc: styleSamples[3]?.src, beforeAlt: styleSamples[3]?.alt },
    { src: styleSamples[2].src, alt: styleSamples[2].alt, beforeSrc: styleSamples[4]?.src, beforeAlt: styleSamples[4]?.alt },
    { src: styleSamples[4].src, alt: styleSamples[4].alt, beforeSrc: homeHero.src, beforeAlt: homeHero.alt },
  ];
}

export function fallbackFoodHomeCarouselImages(): HomeCarouselImage[] {
  const { homeHero: foodHomeHero, styleSamples: foodStyleSamples, archiveItems } = foodPlaceholderImages;

  return [
    { src: foodHomeHero.src, alt: foodHomeHero.alt, beforeSrc: foodStyleSamples[1]?.src, beforeAlt: foodStyleSamples[1]?.alt },
    { src: foodStyleSamples[0].src, alt: foodStyleSamples[0].alt, beforeSrc: archiveItems[1]?.src, beforeAlt: archiveItems[1]?.alt },
    { src: foodStyleSamples[3].src, alt: foodStyleSamples[3].alt, beforeSrc: archiveItems[2]?.src, beforeAlt: archiveItems[2]?.alt },
    { src: foodStyleSamples[4].src, alt: foodStyleSamples[4].alt, beforeSrc: archiveItems[4]?.src, beforeAlt: archiveItems[4]?.alt },
  ];
}

function fallbackHomeCarouselImagesForVertical(vertical: VerticalId) {
  return vertical === "food" ? fallbackFoodHomeCarouselImages() : fallbackHomeCarouselImages();
}

export async function getActiveHomeCarouselImages(vertical: VerticalId = DEFAULT_VERTICAL_ID): Promise<HomeCarouselImage[]> {
  const slides = await db.homeCarouselSlide.findMany({
    where: { vertical, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    take: 8,
  });

  if (slides.length === 0) {
    return fallbackHomeCarouselImagesForVertical(vertical);
  }

  return slides.map((slide) => ({
    src: storageThumbnailUrlFromKeyOrUrl(slide.afterStorageKey, slide.afterImageUrl, "preview") || slide.afterImageUrl,
    alt: slide.afterAlt || slide.title || "نمونه خروجی اوالا",
    beforeSrc: storageThumbnailUrlFromKeyOrUrl(slide.beforeStorageKey, slide.beforeImageUrl, "preview") || slide.beforeImageUrl,
    beforeAlt: slide.beforeAlt || (slide.title ? `${slide.title} قبل` : "تصویر قبل از ادیت"),
  }));
}
