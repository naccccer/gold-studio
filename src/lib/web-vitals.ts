export const WEB_VITAL_NAMES = ["INP", "LCP", "CLS", "FCP", "TTFB"] as const;
export type WebVitalName = (typeof WEB_VITAL_NAMES)[number];

export function isWebVitalName(value: unknown): value is WebVitalName {
  return typeof value === "string" && WEB_VITAL_NAMES.includes(value as WebVitalName);
}

export function webVitalDisplayValue(name: WebVitalName, value: number) {
  return name === "CLS" ? value.toFixed(3) : `${Math.round(value).toLocaleString("fa-IR")} ms`;
}

export function percentile(values: number[], quantile: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index];
}

export function summarizeWebVitals(
  samples: Array<{ name: string; value: number; rating: string; path: string }>,
) {
  return WEB_VITAL_NAMES.flatMap((name) => {
    const matching = samples.filter((sample) => sample.name === name);
    if (matching.length === 0) return [];
    const good = matching.filter((sample) => sample.rating === "good").length;
    return [
      {
        name,
        count: matching.length,
        p75: percentile(matching.map((sample) => sample.value), 0.75) ?? 0,
        goodPercent: Math.round((good / matching.length) * 100),
      },
    ];
  });
}

export function summarizeSlowWebVitalPaths(
  samples: Array<{ name: string; value: number; path: string }>,
  name: WebVitalName = "INP",
) {
  const byPath = new Map<string, number[]>();
  for (const sample of samples) {
    if (sample.name !== name) continue;
    const values = byPath.get(sample.path) ?? [];
    values.push(sample.value);
    byPath.set(sample.path, values);
  }

  return [...byPath.entries()]
    .map(([path, values]) => ({ path, count: values.length, p75: percentile(values, 0.75) ?? 0 }))
    .filter((item) => item.count >= 3)
    .sort((a, b) => b.p75 - a.p75)
    .slice(0, 8);
}
