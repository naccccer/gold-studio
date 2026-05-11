export function generateNumericSupportCode(seed?: string | null) {
  const digits = (seed ?? "").replace(/\D/g, "");
  return (digits.slice(-6) || `${Date.now()}`.slice(-6)).padStart(6, "0");
}

export function logSupportError(
  scope: string,
  supportCode: string,
  error: unknown,
  extra?: Record<string, unknown>,
) {
  console.error(`[${scope}] supportCode=${supportCode}`, {
    supportCode,
    ...extra,
    error,
  });
}
