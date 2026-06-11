import { db } from "@/lib/db";
import { imageProvider, normalizeImageProvider, type ImageProvider } from "@/lib/ai/provider";

export const LIARA_IMAGE_MODELS = [
  "google/gemini-3-pro-image-preview",
  "google/gemini-2.5-flash-image",
  "openai/gpt-image-2",
] as const;

export const AVALAI_IMAGE_MODELS = [
  "gemini-3-pro-image",
  "gemini-3-pro-image-preview",
  "gemini-3.1-flash-image",
  "gemini-3.1-flash-image-preview",
  "gpt-image-2",
] as const;

export const SUPPORTED_IMAGE_MODELS = [...LIARA_IMAGE_MODELS, ...AVALAI_IMAGE_MODELS] as const;

export type SupportedImageModel = (typeof SUPPORTED_IMAGE_MODELS)[number];

export type ProviderSettings = {
  imageProvider: ImageProvider;
  activeModel: SupportedImageModel;
  fallbackModels: SupportedImageModel[];
  autoFallback: boolean;
};

const DEFAULT_ACTIVE_MODEL: SupportedImageModel = "google/gemini-3-pro-image-preview";
const DEFAULT_FALLBACK_MODELS: SupportedImageModel[] = ["google/gemini-2.5-flash-image", "openai/gpt-image-2"];
const DEFAULT_AVALAI_MODEL: SupportedImageModel = "gemini-3.1-flash-image";

async function ensureProviderSettingsTable() {
  await db.$executeRaw`
    CREATE TABLE IF NOT EXISTS ProviderSettings (
      id VARCHAR(191) NOT NULL,
      imageProvider VARCHAR(32) NULL,
      activeModel VARCHAR(191) NOT NULL,
      fallbackModels TEXT NOT NULL,
      autoFallback BOOLEAN NOT NULL DEFAULT true,
      updatedAt DATETIME(3) NOT NULL,
      PRIMARY KEY (id)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `;

  const columns = await db.$queryRaw<Array<{ count: bigint | number | string }>>`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'ProviderSettings'
      AND COLUMN_NAME = 'imageProvider'
  `;
  const columnCount = Number(columns[0]?.count ?? 0);
  if (columnCount === 0) {
    await db.$executeRawUnsafe("ALTER TABLE ProviderSettings ADD COLUMN imageProvider VARCHAR(32) NULL AFTER id");
  }
}

function isProviderImageModel(value: string, provider: ImageProvider): value is SupportedImageModel {
  const models = provider === "avalai" ? AVALAI_IMAGE_MODELS : LIARA_IMAGE_MODELS;
  return (models as readonly string[]).includes(value);
}

function providerImageModels(provider: ImageProvider) {
  return provider === "avalai" ? [...AVALAI_IMAGE_MODELS] : [...LIARA_IMAGE_MODELS];
}

function envImageModel(provider: ImageProvider) {
  const model =
    provider === "avalai"
      ? process.env.AVALAI_IMAGE_MODEL?.trim() || ""
      : process.env.LIARA_IMAGE_MODEL?.trim() || process.env.GAPGPT_IMAGE_MODEL?.trim() || "";
  if (model && isProviderImageModel(model, provider)) {
    return model;
  }

  return provider === "avalai" ? DEFAULT_AVALAI_MODEL : DEFAULT_ACTIVE_MODEL;
}

function uniqueModels(models: string[], provider: ImageProvider) {
  const selectedModels = new Set(models);
  return providerImageModels(provider).filter((model) => selectedModels.has(model));
}

function fallbackModelsFor(activeModel: SupportedImageModel, provider: ImageProvider) {
  return providerImageModels(provider).filter((model) => model !== activeModel);
}

function parseFallbackModels(value: string | null | undefined, activeModel: SupportedImageModel, provider: ImageProvider) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return uniqueModels(parsed.map(String), provider).filter((model) => model !== activeModel);
  } catch {
    return [];
  }
}

export function normalizeProviderSettings({
  imageProvider: selectedProvider,
  activeModel,
  fallbackModels,
  autoFallback,
}: {
  imageProvider?: string | null;
  activeModel?: string | null;
  fallbackModels?: string[] | null;
  autoFallback?: boolean | null;
}): ProviderSettings {
  const safeImageProvider = selectedProvider ? normalizeImageProvider(selectedProvider) : imageProvider();
  const safeActiveModel = activeModel && isProviderImageModel(activeModel, safeImageProvider) ? activeModel : envImageModel(safeImageProvider);
  const defaultFallbackModels = safeImageProvider === "avalai" ? [] : DEFAULT_FALLBACK_MODELS;
  const normalizedFallbackModels = uniqueModels(fallbackModels ?? defaultFallbackModels, safeImageProvider).filter((model) => model !== safeActiveModel);
  const wantsAutoFallback = autoFallback ?? true;
  const safeFallbackModels =
    wantsAutoFallback && normalizedFallbackModels.length === 0 ? fallbackModelsFor(safeActiveModel, safeImageProvider) : normalizedFallbackModels;

  return {
    imageProvider: safeImageProvider,
    activeModel: safeActiveModel,
    fallbackModels: safeFallbackModels,
    autoFallback: wantsAutoFallback,
  };
}

export async function getProviderSettings(): Promise<ProviderSettings> {
  type Row = {
    imageProvider: string | null;
    activeModel: string;
    fallbackModels: string;
    autoFallback: boolean | number | string;
  };

  try {
    await ensureProviderSettingsTable();
    const rows = await db.$queryRaw<Row[]>`
      SELECT imageProvider, activeModel, fallbackModels, autoFallback
      FROM ProviderSettings
      WHERE id = 'default'
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return normalizeProviderSettings({
        imageProvider: imageProvider(),
        activeModel: envImageModel(imageProvider()),
        fallbackModels: DEFAULT_FALLBACK_MODELS,
        autoFallback: true,
      });
    }

    const currentProvider = normalizeImageProvider(row.imageProvider || imageProvider());
    return normalizeProviderSettings({
      imageProvider: currentProvider,
      activeModel: row.activeModel,
      fallbackModels: parseFallbackModels(row.fallbackModels, row.activeModel as SupportedImageModel, currentProvider),
      autoFallback: row.autoFallback === true || row.autoFallback === 1 || row.autoFallback === "1",
    });
  } catch {
    return normalizeProviderSettings({
      imageProvider: imageProvider(),
      activeModel: envImageModel(imageProvider()),
      fallbackModels: DEFAULT_FALLBACK_MODELS,
      autoFallback: true,
    });
  }
}

export async function updateProviderSettings(settings: ProviderSettings) {
  await ensureProviderSettingsTable();
  await db.$executeRaw`
    INSERT INTO ProviderSettings (id, imageProvider, activeModel, fallbackModels, autoFallback, updatedAt)
    VALUES ('default', ${settings.imageProvider}, ${settings.activeModel}, ${JSON.stringify(settings.fallbackModels)}, ${settings.autoFallback}, NOW(3))
    ON DUPLICATE KEY UPDATE
      imageProvider = VALUES(imageProvider),
      activeModel = VALUES(activeModel),
      fallbackModels = VALUES(fallbackModels),
      autoFallback = VALUES(autoFallback),
      updatedAt = NOW(3)
  `;
}

export function getImageModelAttemptOrder(settings: ProviderSettings) {
  return settings.autoFallback ? [settings.activeModel, ...settings.fallbackModels] : [settings.activeModel];
}

export type ProviderModelAttempt = {
  provider: ImageProvider;
  model: SupportedImageModel;
};

function isExpensiveGptModel(model: string) {
  return model.includes("gpt-image-2");
}

function sortGptLast(attempts: ProviderModelAttempt[]) {
  return [
    ...attempts.filter((attempt) => !isExpensiveGptModel(attempt.model)),
    ...attempts.filter((attempt) => isExpensiveGptModel(attempt.model)),
  ];
}

export function getImageProviderAttemptOrder(settings: ProviderSettings): ProviderModelAttempt[] {
  const primaryAttempts = getImageModelAttemptOrder(settings).map((model) => ({
    provider: settings.imageProvider,
    model,
  }));
  const secondaryProvider: ImageProvider = settings.imageProvider === "avalai" ? "liara" : "avalai";
  const secondaryModels = providerImageModels(secondaryProvider);
  const secondaryAttempts = secondaryModels.map((model) => ({
    provider: secondaryProvider,
    model,
  }));

  return sortGptLast([...primaryAttempts, ...secondaryAttempts]);
}
