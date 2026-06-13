export type LoginIdentifier =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const IRAN_MOBILE_PATTERN = /^09\d{9}$/;

const digitMap: Record<string, string> = {
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

export function validateEmail(value: string) {
  return EMAIL_PATTERN.test(value);
}

export function normalizeDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => digitMap[digit] ?? digit);
}

export function normalizePhone(value: string) {
  const compact = normalizeDigits(value).replace(/[\s().-]/g, "");
  let phone = compact;

  if (phone.startsWith("+98")) {
    phone = `0${phone.slice(3)}`;
  } else if (phone.startsWith("0098")) {
    phone = `0${phone.slice(4)}`;
  } else if (phone.startsWith("98") && phone.length === 12) {
    phone = `0${phone.slice(2)}`;
  } else if (phone.startsWith("9") && phone.length === 10) {
    phone = `0${phone}`;
  }

  const digitsOnly = phone.replace(/\D/g, "");
  return IRAN_MOBILE_PATTERN.test(digitsOnly) ? digitsOnly : null;
}

export function normalizeLoginIdentifier(value: FormDataEntryValue | null): LoginIdentifier | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const maybeEmail = raw.toLowerCase();
  if (validateEmail(maybeEmail)) {
    return { kind: "email", value: maybeEmail };
  }

  const phone = normalizePhone(raw);
  return phone ? { kind: "phone", value: phone } : null;
}
