import { db } from "@/lib/db";

export const SUPPORTED_IMAGE_MODELS = [
  "google/gemini-3-pro-image-preview",
  "openai/gpt-image-2",
  "google/gemini-2.5-flash-image",
] as const;

export type SupportedImageModel = (typeof SUPPORTED_IMAGE_MODELS)[number];

export type ProviderSettings = {
  activeModel: SupportedImageModel;
  fallbackModels: SupportedImageModel[];
  autoFallback: boolean;
};

const DEFAULT_ACTIVE_MODEL: SupportedImageModel = "google/gemini-3-pro-image-preview";
const DEFAULT_FALLBACK_MODELS: SupportedImageModel[] = ["openai/gpt-image-2", "google/gemini-2.5-flash-image"];

function isSupportedImageModel(value: string): value is SupportedImageModel {
  return (SUPPORTED_IMAGE_MODELS as readonly string[]).includes(value);
}

function envImageModel() {
  const model = process.env.LIARA_IMAGE_MODEL?.trim() || process.env.GAPGPT_IMAGE_MODEL?.trim() || "";
  return isSupportedImageModel(model) ? model : DEFAULT_ACTIVE_MODEL;
}

function uniqueModels(models: string[]) {
  return Array.from(new Set(models.filter(isSupportedImageModel)));
}

function parseFallbackModels(value: string | null | undefined, activeModel: SupportedImageModel) {
  if (!value) {
    return DEFAULT_FALLBACK_MODELS.filter((model) => model !== activeModel);
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return DEFAULT_FALLBACK_MODELS.filter((model) => model !== activeModel);
    }

    return uniqueModels(parsed.map(String)).filter((model) => model !== activeModel);
  } catch {
    return DEFAULT_FALLBACK_MODELS.filter((model) => model !== activeModel);
  }
}

export function normalizeProviderSettings({
  activeModel,
  fallbackModels,
  autoFallback,
}: {
  activeModel?: string | null;
  fallbackModels?: string[] | null;
  autoFallback?: boolean | null;
}): ProviderSettings {
  const safeActiveModel = activeModel && isSupportedImageModel(activeModel) ? activeModel : envImageModel();
  const safeFallbackModels = uniqueModels(fallbackModels ?? DEFAULT_FALLBACK_MODELS).filter((model) => model !== safeActiveModel);

  return {
    activeModel: safeActiveModel,
    fallbackModels: safeFallbackModels,
    autoFallback: autoFallback ?? true,
  };
}

export async function getProviderSettings(): Promise<ProviderSettings> {
  type Row = {
    activeModel: string;
    fallbackModels: string;
    autoFallback: boolean | number | string;
  };

  try {
    const rows = await db.$queryRaw<Row[]>`
      SELECT activeModel, fallbackModels, autoFallback
      FROM ProviderSettings
      WHERE id = 'default'
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return normalizeProviderSettings({ activeModel: envImageModel(), fallbackModels: DEFAULT_FALLBACK_MODELS, autoFallback: true });
    }

    const activeModel = isSupportedImageModel(row.activeModel) ? row.activeModel : envImageModel();
    return normalizeProviderSettings({
      activeModel,
      fallbackModels: parseFallbackModels(row.fallbackModels, activeModel),
      autoFallback: row.autoFallback === true || row.autoFallback === 1 || row.autoFallback === "1",
    });
  } catch {
    return normalizeProviderSettings({ activeModel: envImageModel(), fallbackModels: DEFAULT_FALLBACK_MODELS, autoFallback: true });
  }
}

export async function updateProviderSettings(settings: ProviderSettings) {
  await db.$executeRaw`
    INSERT INTO ProviderSettings (id, activeModel, fallbackModels, autoFallback, updatedAt)
    VALUES ('default', ${settings.activeModel}, ${JSON.stringify(settings.fallbackModels)}, ${settings.autoFallback}, NOW(3))
    ON DUPLICATE KEY UPDATE
      activeModel = VALUES(activeModel),
      fallbackModels = VALUES(fallbackModels),
      autoFallback = VALUES(autoFallback),
      updatedAt = NOW(3)
  `;
}

export function getImageModelAttemptOrder(settings: ProviderSettings) {
  return settings.autoFallback ? [settings.activeModel, ...settings.fallbackModels] : [settings.activeModel];
}
