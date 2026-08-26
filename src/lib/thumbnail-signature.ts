import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_LIFETIME_SECONDS = 24 * 60 * 60;
const SIGNATURE_BUCKET_SECONDS = 60 * 60;

function payload(storageKey: string, preset: string, expiresAt: number) {
  return `${preset}\n${storageKey.replace(/\\/g, "/")}\n${expiresAt}`;
}

export function thumbnailSignatureSecret() {
  return process.env.THUMBNAIL_URL_SECRET?.trim() || process.env.AUTH_SECRET?.trim() || null;
}

export function thumbnailSignatureExpiry(nowMs = Date.now()) {
  const nowSeconds = Math.floor(nowMs / 1000);
  const bucketStart = Math.floor(nowSeconds / SIGNATURE_BUCKET_SECONDS) * SIGNATURE_BUCKET_SECONDS;
  return bucketStart + SIGNATURE_LIFETIME_SECONDS;
}

export function createThumbnailSignature({
  storageKey,
  preset,
  expiresAt,
  secret,
}: {
  storageKey: string;
  preset: string;
  expiresAt: number;
  secret: string;
}) {
  return createHmac("sha256", secret).update(payload(storageKey, preset, expiresAt)).digest("base64url");
}

export function verifyThumbnailSignature({
  storageKey,
  preset,
  expiresAt,
  signature,
  secret,
  nowMs = Date.now(),
}: {
  storageKey: string;
  preset: string;
  expiresAt: number;
  signature: string;
  secret: string;
  nowMs?: number;
}) {
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!Number.isInteger(expiresAt) || expiresAt <= nowSeconds || expiresAt > nowSeconds + SIGNATURE_LIFETIME_SECONDS + SIGNATURE_BUCKET_SECONDS) {
    return false;
  }

  const expected = createThumbnailSignature({ storageKey, preset, expiresAt, secret });
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
