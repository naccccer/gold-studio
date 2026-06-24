import "server-only";

import { access, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

export const readyStyleReferenceSamplePublicBasePath = "/images/Samples";
export const readyStyleReferenceSampleDirectory = path.join(process.cwd(), "public", "images", "Samples");
const foodReadyStyleReferenceSamplePublicBasePath = "/images/placeholders/food";
const foodReadyStyleReferenceSampleDirectory = path.join(process.cwd(), "public", "images", "placeholders", "food");

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
  "style-ref-blue-pendant-warm.webp",
  "style-ref-chain-editorial-magazine.webp",
  "style-ref-diamond-ring-black.webp",
  "style-ref-diamond-stack-minimal.webp",
  "style-ref-gem-earrings-leaf.webp",
  "style-ref-gold-hoops-stone.webp",
  "style-ref-gold-set-dark-stone.webp",
  "style-ref-hoop-earring-model.webp",
  "style-ref-layered-necklace-model.webp",
  "style-ref-rings-satin-hand.webp",
  "style-ref-rose-rings-box.webp",
  "style-ref-snake-chain-black.webp",
  "style-ref-watch-blue-editorial.webp",
  "style-ref-watch-clean-catalog.webp",
  "style-ref-watch-dark-leather.webp",
  "wood-ring.webp",
];

const foodSampleFiles = [
  "food-cafe-item.webp",
  "food-dessert-chocolate.webp",
  "food-packaged.webp",
  "food-restaurant-plate.webp",
  "food-dessert-strawberry.webp",
  "food-dish-natural.webp",
  "food-drink-social.webp",
  "food-home-ugc.webp",
  "food-menu-catalog.webp",
  "food-ref-dark-dessert-ceramic.webp",
  "food-ref-iced-berry-drink.webp",
  "food-ref-latte-pastry-cafe.webp",
  "food-ref-pasta-editorial.webp",
  "food-style-luxury.webp",
  "food-style-minimal.webp",
  "food-style-social.webp",
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
  "style-ref-blue-pendant-warm": {
    title: "گردنبند با نور گرم",
    alt: "نمونه عکس گردنبند طلایی با آویز آبی و نور گرم ادیتوریال",
  },
  "style-ref-chain-editorial-magazine": {
    title: "زنجیر روی مجله",
    alt: "نمونه عکس زنجیر طلایی روی مجله با نور طبیعی و عمق میدان کم",
  },
  "style-ref-diamond-ring-black": {
    title: "انگشتر روی زمینه تیره",
    alt: "نمونه عکس انگشتر نگین‌دار روی سطح مشکی با نور کنترل‌شده",
  },
  "style-ref-diamond-stack-minimal": {
    title: "چیدمان مینیمال نگین",
    alt: "نمونه عکس انگشتر و نگین روی زمینه روشن با چیدمان مینیمال",
  },
  "style-ref-gem-earrings-leaf": {
    title: "گوشواره سنگی",
    alt: "نمونه عکس گوشواره سنگی روی برگ سبز با کنتراست رنگی واضح",
  },
  "style-ref-gold-hoops-stone": {
    title: "گوشواره طلایی و سنگ",
    alt: "نمونه عکس گوشواره طلایی کنار سنگ با سایه نرم و فضای استودیویی",
  },
  "style-ref-gold-set-dark-stone": {
    title: "ست طلایی تیره",
    alt: "نمونه عکس ست طلایی روی سنگ تیره با نورپردازی لوکس",
  },
  "style-ref-hoop-earring-model": {
    title: "گوشواره با مدل",
    alt: "نمونه عکس گوشواره حلقه‌ای روی مدل با قاب نزدیک و طبیعی",
  },
  "style-ref-layered-necklace-model": {
    title: "گردنبند لایه‌ای",
    alt: "نمونه عکس گردنبند و انگشتر روی مدل با لباس روشن",
  },
  "style-ref-rings-satin-hand": {
    title: "انگشتر روی ساتن",
    alt: "نمونه عکس انگشترهای ظریف روی دست و پارچه ساتن",
  },
  "style-ref-rose-rings-box": {
    title: "انگشتر رزگلد در جعبه",
    alt: "نمونه عکس انگشترهای رزگلد داخل جعبه مخملی روشن",
  },
  "style-ref-snake-chain-black": {
    title: "زنجیر طلایی روی مشکی",
    alt: "نمونه عکس زنجیر تخت طلایی روی لباس مشکی با حس ادیتوریال",
  },
  "style-ref-watch-blue-editorial": {
    title: "ساعت طلایی آبی",
    alt: "نمونه عکس ساعت طلایی با انعکاس و پس‌زمینه آبی ادیتوریال",
  },
  "style-ref-watch-clean-catalog": {
    title: "ساعت کاتالوگی روشن",
    alt: "نمونه عکس ساعت روی زمینه روشن برای خروجی کاتالوگی تمیز",
  },
  "style-ref-watch-dark-leather": {
    title: "ساعت چرمی تیره",
    alt: "نمونه عکس ساعت چرمی روی زمینه مشکی با انعکاس لوکس",
  },
  "wood-ring": {
    title: "انگشتر و چوب",
    alt: "نمونه عکس انگشتر با بافت چوبی",
  },
};

const foodSampleMetadata: Record<string, { title: string; alt: string }> = {
  "food-cafe-item": {
    title: "چیدمان کافه",
    alt: "نمونه چیدمان کروسان و قهوه برای عکس کافه",
  },
  "food-dessert-chocolate": {
    title: "دسر شکلاتی",
    alt: "نمونه عکس دسر شکلاتی با نور استودیویی",
  },
  "food-packaged": {
    title: "بسته‌بندی غذا",
    alt: "نمونه عکس غذای بسته‌بندی‌شده برای فروش آنلاین",
  },
  "food-restaurant-plate": {
    title: "بشقاب رستورانی",
    alt: "نمونه چیدمان بشقاب رستورانی مینیمال",
  },
  "food-dessert-strawberry": {
    title: "دسر توت‌فرنگی",
    alt: "نمونه عکس دسر توت‌فرنگی برای منوی رستوران",
  },
  "food-dish-natural": {
    title: "بشقاب با نور طبیعی",
    alt: "نمونه عکس غذای رستورانی با نور طبیعی و چیدمان تمیز",
  },
  "food-drink-social": {
    title: "نوشیدنی اجتماعی",
    alt: "نمونه عکس نوشیدنی برای پست شبکه اجتماعی",
  },
  "food-home-ugc": {
    title: "حس خانگی تمیز",
    alt: "نمونه عکس غذا با حس خانگی، نور نرم و کادر مناسب شبکه اجتماعی",
  },
  "food-menu-catalog": {
    title: "منوی کاتالوگی",
    alt: "نمونه عکس غذا برای منوی آنلاین با کادر ساده و خوانا",
  },
  "food-ref-dark-dessert-ceramic": {
    title: "دسر روی سرامیک تیره",
    alt: "نمونه عکس دسر حرفه‌ای روی ظرف سرامیکی تیره با نور کنترل‌شده",
  },
  "food-ref-iced-berry-drink": {
    title: "نوشیدنی یخی بری",
    alt: "نمونه عکس نوشیدنی یخی رنگی با لیوان شفاف و حس کافه‌ای حرفه‌ای",
  },
  "food-ref-latte-pastry-cafe": {
    title: "لاته و شیرینی کافه",
    alt: "نمونه عکس لاته و شیرینی با نور پنجره و چیدمان پینترستی",
  },
  "food-ref-pasta-editorial": {
    title: "پاستای ادیتوریال",
    alt: "نمونه عکس غذای رستورانی با سس براق، چیدمان حرفه‌ای و بک‌گراند مینیمال",
  },
  "food-style-luxury": {
    title: "لوکس رستورانی",
    alt: "نمونه عکس غذا با نورپردازی لوکس و چیدمان مناسب رستوران",
  },
  "food-style-minimal": {
    title: "مینیمال روشن",
    alt: "نمونه عکس غذا با زمینه روشن، سایه نرم و فضای تمیز",
  },
  "food-style-social": {
    title: "اجتماعی پینترستی",
    alt: "نمونه عکس غذا و نوشیدنی برای شبکه اجتماعی با حس پینترستی",
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

export function readyStyleReferenceSampleDirectoryForVertical(vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  return vertical === "food" ? foodReadyStyleReferenceSampleDirectory : readyStyleReferenceSampleDirectory;
}

async function listSampleDirectoryFiles(vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  try {
    return await readdir(readyStyleReferenceSampleDirectoryForVertical(vertical));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

function samplePathCandidates(fileName: string, vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  if (vertical === "food") {
    return [
      path.join(process.cwd(), "public", "images", "placeholders", "food", fileName),
      path.join(process.cwd(), ".next", "standalone", "public", "images", "placeholders", "food", fileName),
    ];
  }

  return [
    path.join(process.cwd(), "public", "images", "Samples", fileName),
    path.join(process.cwd(), "public", "images", "samples", fileName),
    path.join(process.cwd(), ".next", "standalone", "public", "images", "Samples", fileName),
    path.join(process.cwd(), ".next", "standalone", "public", "images", "samples", fileName),
  ];
}

async function findExistingSampleFilePath(fileName: string, vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  for (const candidate of samplePathCandidates(fileName, vertical)) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known deployment layout.
    }
  }

  return path.join(vertical === "food" ? foodReadyStyleReferenceSampleDirectory : readyStyleReferenceSampleDirectory, fileName);
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

export async function ensureReadyStyleReferenceSampleDirectory(vertical: VerticalId = DEFAULT_VERTICAL_ID) {
  await mkdir(readyStyleReferenceSampleDirectoryForVertical(vertical), { recursive: true });
}

export async function getReadyStyleReferenceSamples(vertical: VerticalId = DEFAULT_VERTICAL_ID): Promise<ReadyStyleReferenceSample[]> {
  const directoryFiles = await listSampleDirectoryFiles(vertical);
  const uploadedFoodSampleFiles = directoryFiles.filter((fileName) => fileName.startsWith("ready-sample-"));
  const fileNames =
    vertical === "food"
      ? Array.from(new Set([...foodSampleFiles, ...uploadedFoodSampleFiles]))
      : Array.from(new Set([...sampleFiles, ...directoryFiles]));
  const basePath = vertical === "food" ? foodReadyStyleReferenceSamplePublicBasePath : readyStyleReferenceSamplePublicBasePath;
  const metadataById = vertical === "food" ? foodSampleMetadata : sampleMetadata;
  const samples = await Promise.all(
    fileNames
      .filter((fileName) => allowedSampleExtensions.has(path.extname(fileName).toLowerCase()))
      .map(async (fileName) => {
        const id = sampleIdFromFileName(fileName);
        const metadata = metadataById[id];
        const filePath = await findExistingSampleFilePath(fileName, vertical);
        const info = await stat(filePath).catch(() => null);

        return {
          vertical,
          id,
          fileName,
          filePath,
          fileUrl: `${basePath}/${encodeURIComponent(fileName)}`,
          title: metadata?.title ?? fallbackTitleFromId(id),
          alt: metadata?.alt ?? (vertical === "food" ? "نمونه آماده عکس غذا و نوشیدنی" : "نمونه آماده عکس جواهر"),
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
  for (const candidate of samplePathCandidates(sample.fileName, sample.vertical)) {
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
