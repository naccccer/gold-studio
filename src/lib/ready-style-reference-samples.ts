import "server-only";

import { access, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

export const readyStyleReferenceSamplePublicBasePath = "/images/Samples";
export const readyStyleReferenceSampleDirectory = path.join(process.cwd(), "public", "images", "Samples");

const allowedSampleExtensions = new Set([".webp"]);

const sampleFiles = [
  "bw-ring-woman.webp",
  "c0fb4190cd96c9391b843c31fac66b86.webp",
  "Hand-Ring-under-water.webp",
  "hand-ring-woman.webp",
  "man-hand.webp",
  "man-ring-hand-formal.webp",
  "man-ring-hand.webp",
  "Model-earing-hand.webp",
  "Model-ring-hand.webp",
  "neckless-editorial-wooddecor.webp",
  "Ring-Redbg.webp",
  "shadow.webp",
  "wood-ring.webp",
];

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
  vertical: VerticalId;
  id: string;
  fileName: string;
  filePath: string;
  fileUrl: string;
  title: string;
  alt: string;
  size: number;
  updatedAt: Date;
};

async function listSampleDirectoryFiles() {
  try {
    return await readdir(readyStyleReferenceSampleDirectory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function samplePathCandidates(fileName: string) {
  return [
    path.join(process.cwd(), "public", "images", "Samples", fileName),
    path.join(process.cwd(), "public", "images", "samples", fileName),
    path.join(process.cwd(), ".next", "standalone", "public", "images", "Samples", fileName),
    path.join(process.cwd(), ".next", "standalone", "public", "images", "samples", fileName),
  ];
}

async function findExistingSampleFilePath(fileName: string) {
  for (const candidate of samplePathCandidates(fileName)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known deployment layout.
    }
  }

  return path.join(readyStyleReferenceSampleDirectory, fileName);
}

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

export async function getReadyStyleReferenceSamples(vertical: VerticalId = DEFAULT_VERTICAL_ID): Promise<ReadyStyleReferenceSample[]> {
  const directoryFiles = await listSampleDirectoryFiles();
  const fileNames = Array.from(new Set([...sampleFiles, ...directoryFiles]));
  const sampleVertical: VerticalId = DEFAULT_VERTICAL_ID;
  const samples = await Promise.all(
    fileNames
      .filter((fileName) => allowedSampleExtensions.has(path.extname(fileName).toLowerCase()))
      .map(async (fileName) => {
        const id = sampleIdFromFileName(fileName);
        const metadata = sampleMetadata[id];
        const filePath = await findExistingSampleFilePath(fileName);
        const info = await stat(filePath).catch(() => null);

        return {
          vertical: sampleVertical,
          id,
          fileName,
          filePath,
          fileUrl: `${readyStyleReferenceSamplePublicBasePath}/${encodeURIComponent(fileName)}`,
          title: metadata?.title ?? fallbackTitleFromId(id),
          alt: metadata?.alt ?? "نمونه آماده عکس جواهر",
          size: info?.size ?? 0,
          updatedAt: info?.mtime ?? new Date(0),
        };
      }),
  );

  return samples
    .filter((sample) => sample.vertical === vertical)
    .sort((left, right) => left.fileName.localeCompare(right.fileName, "en"));
}

export async function getReadyStyleReferenceSample(sampleId: string, vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  const samples = await getReadyStyleReferenceSamples(vertical);
  return samples.find((sample) => sample.id === sampleId) ?? null;
}

export async function readReadyStyleReferenceSample(sample: ReadyStyleReferenceSample) {
  for (const candidate of samplePathCandidates(sample.fileName)) {
    try {
      return await readFile(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error(`Ready style reference sample file is missing: ${sample.fileName}`);
}
