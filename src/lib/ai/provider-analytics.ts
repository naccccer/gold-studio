import { percentile } from "@/lib/web-vitals";

type NumericValue = number | string | { toString(): string } | null | undefined;

type ProviderEventSample = {
  provider: string;
  model: string | null;
  status: "SUCCESS" | "FAILED";
  durationMs: number | null;
  costUnit: NumericValue;
  costPaidIrt: NumericValue;
  costGrantIrt: NumericValue;
  costResolvedAt: Date | null;
};

function numeric(value: NumericValue) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function summarizeProviderModels(events: ProviderEventSample[]) {
  const groups = new Map<
    string,
    {
      provider: string;
      model: string;
      attempts: number;
      successes: number;
      failures: number;
      durations: number[];
      resolvedCosts: number;
      totalCostIrt: number;
      resolvedUnitCosts: number;
      totalCostUnit: number;
    }
  >();

  for (const event of events) {
    const model = event.model || "unknown";
    const key = `${event.provider}\n${model}`;
    const group = groups.get(key) ?? {
      provider: event.provider,
      model,
      attempts: 0,
      successes: 0,
      failures: 0,
      durations: [],
      resolvedCosts: 0,
      totalCostIrt: 0,
      resolvedUnitCosts: 0,
      totalCostUnit: 0,
    };
    group.attempts += 1;
    if (event.status === "SUCCESS") {
      group.successes += 1;
      if (event.durationMs !== null) group.durations.push(event.durationMs);
    } else {
      group.failures += 1;
    }
    if (event.costResolvedAt) {
      const costIrt = numeric(event.costPaidIrt) + numeric(event.costGrantIrt);
      const costUnit = numeric(event.costUnit);
      if (costIrt > 0 || costUnit === 0) {
        group.resolvedCosts += 1;
        group.totalCostIrt += costIrt;
      }
      if (costIrt === 0 && costUnit > 0) {
        group.resolvedUnitCosts += 1;
        group.totalCostUnit += costUnit;
      }
    }
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => ({
      provider: group.provider,
      model: group.model,
      attempts: group.attempts,
      successes: group.successes,
      failures: group.failures,
      successPercent: group.attempts ? Math.round((group.successes / group.attempts) * 100) : 0,
      p50DurationMs: percentile(group.durations, 0.5),
      p95DurationMs: percentile(group.durations, 0.95),
      averageCostIrt: group.resolvedCosts ? Math.round(group.totalCostIrt / group.resolvedCosts) : null,
      averageCostUnit: group.resolvedUnitCosts ? group.totalCostUnit / group.resolvedUnitCosts : null,
      resolvedCosts: group.resolvedCosts,
      resolvedUnitCosts: group.resolvedUnitCosts,
    }))
    .sort((a, b) => b.attempts - a.attempts || a.model.localeCompare(b.model));
}
