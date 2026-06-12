type FarazPatternInput = {
  phone: string;
  code: string;
};

export class FarazSmsConfigError extends Error {}
export class FarazSmsSendError extends Error {
  constructor(
    message: string,
    readonly publicMessage = "ارسال پیامک ناموفق بود. چند دقیقه دیگر دوباره تلاش کنید.",
  ) {
    super(message);
  }
}

const FARAZ_PATTERN_URL = "https://api.iranpayamak.com/ws/v1/sms/pattern";

function envValue(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

function getFarazSmsConfig() {
  const apiKey = envValue("FARAZSMS_API_KEY");
  const patternCode = envValue("FARAZSMS_PATTERN_CODE");
  const lineNumber = envValue("FARAZSMS_LINE_NUMBER");
  const otpVariableName = envValue("FARAZSMS_OTP_VARIABLE_NAME") ?? "code";

  if (!apiKey || !patternCode) {
    throw new FarazSmsConfigError("FarazSMS is not configured.");
  }

  return { apiKey, patternCode, lineNumber, otpVariableName };
}

export async function sendFarazOtpSms({ phone, code }: FarazPatternInput) {
  const config = getFarazSmsConfig();

  const body: Record<string, unknown> = {
    code: config.patternCode,
    attributes: {
      [config.otpVariableName]: code,
    },
    recipient: phone,
    number_format: "english",
  };

  if (config.lineNumber) {
    body.line_number = config.lineNumber;
  }

  const response = await fetch(FARAZ_PATTERN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Api-Key": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseText = await response.text().catch(() => "");
  const result = responseText ? parseFarazJson(responseText) : null;
  const upstreamMessage = extractFarazMessage(result);
  const publicMessage = getPublicFarazMessage(upstreamMessage);

  if (!response.ok) {
    throw new FarazSmsSendError(`FarazSMS failed with HTTP ${response.status}: ${upstreamMessage}`, publicMessage);
  }

  if (result && typeof result === "object" && "status" in result && result.status !== "success") {
    throw new FarazSmsSendError(`FarazSMS did not accept the OTP request: ${upstreamMessage}`, publicMessage);
  }
}

function extractFarazMessage(result: unknown) {
  if (!result || typeof result !== "object") return "";
  const record = result as Record<string, unknown>;
  const message = record.message ?? record.messages;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(" ");
  if (message && typeof message === "object") return JSON.stringify(message);
  return "";
}

function parseFarazJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getPublicFarazMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("pending") || normalized.includes("active") || message.includes("تایید") || message.includes("فعال")) {
    return "الگوی پیامک هنوز فعال یا تایید نشده است. بعد از تایید فراز دوباره تست کنید.";
  }

  return "ارسال پیامک ناموفق بود. چند دقیقه دیگر دوباره تلاش کنید.";
}
