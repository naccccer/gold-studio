import "server-only";

import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const readyStyleReferenceSamplePublicBasePath = "/images/Samples";
export const readyStyleReferenceSampleDirectory = path.join(process.cwd(), "public", "images", "Samples");

const allowedSampleExtensions = new Set([".webp"]);

const sampleMetadata: Record<string, { title: string; alt: string }> = {
  "bw-ring-woman": {
    title: "انگشتر روی دست",
    alt: "نمونه عکس انگشتر روی دست با فضای سیاه‌وسفید",
  },
  "soft-ring-light": {
    title: "نور نرم",
    alt: "نمونه عکس محصول جواهر با نور نرم و پس‌زمینه روشن",
  },
  "hand-ring-under-water": {
    title: "انگشتر زیر آب",
    alt: "نمونه عکس انگشتر روی دست زیر آب",
  },
  "hand-ring-woman": {
    title: "دست و انگشتر",
    alt: "نمونه عکس انگشتر روی دست با مدل زن",
  },
  "man-hand": {
    title: "دست مردانه",
    alt: "نمونه عکس اکسسوری روی دست مردانه",
  },
  "man-ring-hand": {
    title: "انگشتر مردانه",
    alt: "نمونه عکس انگشتر مردانه روی دست",
  },
  "man-ring-hand-formal": {
    title: "رسمی مردانه",
    alt: "نمونه عکس رسمی انگشتر مردانه",
  },
  "model-earing-hand": {
    title: "گوشواره با مدل",
    alt: "نمونه عکس گوشواره با مدل و دست",
  },
  "model-ring-hand": {
    title: "مدل دست",
    alt: "نمونه عکس انگشتر با مدل دست",
  },
  "neckless-editorial-wooddecor": {
    title: "گردنبند و دکور",
    alt: "نمونه عکس ادیتوریال گردنبند با دکور چوبی",
  },
  "ring-redbg": {
    title: "پس‌زمینه قرمز",
    alt: "نمونه عکس انگشتر روی پس‌زمینه قرمز",
  },
  shadow: {
    title: "سایه نرم",
    alt: "نمونه عکس جواهر با سایه نرم",
  },
  "wood-ring": {
    title: "انگشتر و چوب",
    alt: "نمونه عکس انگشتر با بافت چوبی",
  },
};

const legacyIdByStem: Record<string, string> = {
  c0fb4190cd96c9391b843c31fac66b86: "soft-ring-light",
  "Hand-Ring-under-water": "hand-ring-under-water",
  "Model-earing-hand": "model-earing-hand",
  "Model-ring-hand": "model-ring-hand",
  "Ring-Redbg": "ring-redbg",
};

export type ReadyStyleReferenceSample = {
  id: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  title: string;
  alt: string;
  size: number;
  updatedAt: Date;
};

function sampleIdFromFileName(fileName: string) {
  const stem = path.basename(fileName, path.extname(fileName));
  return legacyIdByStem[stem] ?? stem.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function fallbackTitleFromId(id: string) {
  return id
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function ensureReadyStyleReferenceSampleDirectory() {
  await mkdir(readyStyleReferenceSampleDirectory, { recursive: true });
}

export async function getReadyStyleReferenceSamples(): Promise<ReadyStyleReferenceSample[]> {
  try {
    const fileNames = await readdir(readyStyleReferenceSampleDirectory);
    const samples = await Promise.all(
      fileNames
        .filter((fileName) => allowedSampleExtensions.has(path.extname(fileName).toLowerCase()))
        .map(async (fileName) => {
          const id = sampleIdFromFileName(fileName);
          const metadata = sampleMetadata[id];
          const filePath = path.join(readyStyleReferenceSampleDirectory, fileName);
          const info = await stat(filePath);

          return {
            id,
            fileName,
            filePath,
            fileUrl: `${readyStyleReferenceSamplePublicBasePath}/${encodeURIComponent(fileName)}`,
            title: metadata?.title ?? fallbackTitleFromId(id),
            alt: metadata?.alt ?? "نمونه آماده عکس جواهر",
            size: info.size,
            updatedAt: info.mtime,
          };
        }),
    );

    return samples.sort((left, right) => left.fileName.localeCompare(right.fileName, "en"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function getReadyStyleReferenceSample(sampleId: string) {
  const samples = await getReadyStyleReferenceSamples();
  return samples.find((sample) => sample.id === sampleId) ?? null;
}
