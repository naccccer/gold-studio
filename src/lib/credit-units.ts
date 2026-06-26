import type { VerticalId } from "@/lib/verticals";

export const GENERATION_CREDIT_UNIT_COST_BY_VERTICAL: Record<VerticalId, number> = {
  jewelry: 300,
  food: 100,
  clothing: 300,
  furniture: 300,
};

export function visibleCreditsToCreditUnits(visibleCredits: number) {
  return Math.round(visibleCredits);
}

export function creditUnitsToVisibleCredits(creditUnits: number) {
  return creditUnits;
}

export function getGenerationCreditUnitCost(vertical: VerticalId) {
  return GENERATION_CREDIT_UNIT_COST_BY_VERTICAL[vertical] ?? GENERATION_CREDIT_UNIT_COST_BY_VERTICAL.jewelry;
}

export function getGenerationCustomerCreditCost(vertical: VerticalId) {
  void vertical;
  return 1;
}

export function formatInternalCreditUnits(creditUnits: number, locale = "fa-IR") {
  return `${creditUnits.toLocaleString(locale)} units`;
}
