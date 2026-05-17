export type StyleControlOption = {
  value: string;
  label: string;
};

export type StyleOption = {
  id: string;
  label: string;
  description: string;
  previewImageUrl: string;
  sortOrder: number;
  controls?: Array<{
    key: string;
    label: string;
    type: "CHOICE" | "RANGE" | "BOOLEAN";
    optionsJson?: string | null;
    defaultValue?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
  }>;
};
