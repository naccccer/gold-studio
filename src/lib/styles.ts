import { db } from "@/lib/db";
import type { StyleOption } from "@/features/projects/presets";

function toStyleOption(style: {
  id: string;
  name: string;
  description: string;
  prompt: string;
  previewImageUrl: string;
  sortOrder: number;
  controls?: Array<{
    key: string;
    label: string;
    type: "CHOICE" | "RANGE";
    optionsJson: string | null;
    defaultValue: string | null;
    minValue: number | null;
    maxValue: number | null;
  }>;
}): StyleOption {
  return {
    id: style.id,
    label: style.name,
    description: style.description,
    prompt: style.prompt,
    previewImageUrl: style.previewImageUrl,
    sortOrder: style.sortOrder,
    controls: style.controls ?? [],
  };
}

export async function getUserVisibleStyles(): Promise<StyleOption[]> {
  const styles = await db.creativeStyle.findMany({
    where: { isActive: true, isUserVisible: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      controls: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return styles.map((style) => toStyleOption(style));
}

export async function getStyleForGeneration(styleId: string): Promise<StyleOption | null> {
  const style = await db.creativeStyle.findFirst({
    where: {
      id: styleId,
      isActive: true,
    },
    include: {
      controls: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (style) {
    return toStyleOption(style);
  }

  return null;
}
