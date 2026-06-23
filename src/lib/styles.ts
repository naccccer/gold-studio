import { db } from "@/lib/db";
import type { StyleOption } from "@/features/projects/presets";
import { DEFAULT_VERTICAL_ID, type VerticalId } from "@/lib/verticals";

function toStyleOption(style: {
  id: string;
  name: string;
  description: string;
  previewImageUrl: string;
  sortOrder: number;
  controls?: Array<{
    key: string;
    label: string;
    type: "CHOICE" | "RANGE" | "BOOLEAN";
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
    previewImageUrl: style.previewImageUrl,
    sortOrder: style.sortOrder,
    controls: style.controls ?? [],
  };
}

export async function getUserVisibleStyles(vertical: VerticalId = DEFAULT_VERTICAL_ID): Promise<StyleOption[]> {
  const styles = await db.creativeStyle.findMany({
    where: { vertical, isActive: true, isUserVisible: true, id: { not: "style_warm_luxury" } },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      controls: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return styles.map((style: Parameters<typeof toStyleOption>[0]) => toStyleOption(style));
}

export type StyleForGeneration = StyleOption & {
  prompt: string;
};

export async function getStyleForGeneration(styleId: string, vertical: VerticalId = DEFAULT_VERTICAL_ID): Promise<StyleForGeneration | null> {
  const style = await db.creativeStyle.findFirst({
    where: {
      id: styleId,
      vertical,
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
    return {
      ...toStyleOption(style),
      prompt: style.prompt,
    };
  }

  return null;
}
