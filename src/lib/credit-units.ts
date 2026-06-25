import type { VerticalId } from "@/lib/verticals";

export const CREDIT_UNITS_PER_VISIBLE_CREDIT = 100;

export const GENERATION_CREDIT_UNIT_COST_BY_VERTICAL: Record<VerticalId, number> = {
  jewelry: 300,
  food: 100,
  clothing: 300,
  furniture: 300,
};

export function visibleCreditsToCreditUnits(visibleCredits: number) {
  return Math.round(visibleCredits * CREDIT_UNITS_PER_VISIBLE_CREDIT);
}

export function creditUnitsToVisibleCredits(creditUnits: number) {
  return creditUnits / CREDIT_UNITS_PER_VISIBLE_CREDIT;
}

export function getGenerationCreditUnitCost(vertical: VerticalId) {
  return GENERATION_CREDIT_UNIT_COST_BY_VERTICAL[vertical] ?? GENERATION_CREDIT_UNIT_COST_BY_VERTICAL.jewelry;
}

export function formatCreditUnits(creditUnits: number, locale = "fa-IR") {
  return creditUnitsToVisibleCredits(creditUnits).toLocaleString(locale, {
    maximumFractionDigits: 2,
  });
}
