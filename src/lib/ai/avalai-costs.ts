type AvalaiLookupTransaction = {
  id?: unknown;
  cost?: {
    unit?: unknown;
    paid_irt?: unknown;
    paid_grant_irt?: unknown;
  };
};

type AvalaiLookupResponse = {
  transactions?: AvalaiLookupTransaction[];
};

export type AvalaiTransactionCost = {
  requestId: string;
  unit: string | null;
  paidIrt: string | null;
  grantIrt: string | null;
};

function decimalString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return /^-?\d+(?:\.\d+)?$/.test(normalized) ? normalized : null;
}

export function avalaiCostLookupConfigured() {
  return Boolean(process.env.AVALAI_API_KEY?.trim());
}

export async function lookupAvalaiTransactionCosts(requestIds: string[]) {
  const apiKey = process.env.AVALAI_API_KEY?.trim();
  if (!apiKey || requestIds.length === 0) return [];

  const baseURL = process.env.AVALAI_USER_BASE_URL?.trim() || "https://api.avalai.ir/user/v1";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(`${baseURL.replace(/\/$/, "")}/transactions/lookup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transaction_ids: requestIds.slice(0, 1000) }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AvalAI cost lookup failed with status ${response.status}.`);
    }

    const body = (await response.json()) as AvalaiLookupResponse;
    return (body.transactions ?? []).flatMap((transaction): AvalaiTransactionCost[] => {
      if (typeof transaction.id !== "string" || !transaction.id) return [];
      return [
        {
          requestId: transaction.id,
          unit: decimalString(transaction.cost?.unit),
          paidIrt: decimalString(transaction.cost?.paid_irt),
          grantIrt: decimalString(transaction.cost?.paid_grant_irt),
        },
      ];
    });
  } finally {
    clearTimeout(timeout);
  }
}
