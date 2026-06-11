import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv() {
  try {
    const text = readFileSync(".env", "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]]) continue;

      const rawValue = match[2].trim();
      process.env[match[1]] = rawValue.replace(/^"(.*)"$/, "$1");
    }
  } catch {
    // The check can still run when env vars are provided by the shell.
  }
}

function parseDataUrl(value) {
  const match = String(value || "").match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;
  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function extensionFromMimeType(mimeType) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

function normalizeRequestId(value) {
  const id = String(value || "").match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
  return id || "";
}

async function fetchCost({ userBaseURL, apiKey, requestId }) {
  if (!requestId) return null;

  const response = await fetch(`${userBaseURL.replace(/\/$/, "")}/transactions/lookup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ transaction_ids: [requestId] }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchCostWithRetry(input) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const cost = await fetchCost(input);
    if (cost?.summary?.found > 0) {
      return cost;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return null;
}

loadDotEnv();

const apiKey = process.env.AVALAI_API_KEY;
const baseURL = process.env.AVALAI_BASE_URL || "https://api.avalai.ir/v1";
const userBaseURL = process.env.AVALAI_USER_BASE_URL || "https://api.avalai.ir/user/v1";
const model = process.env.AVALAI_IMAGE_MODEL || "gemini-3.1-flash-image";
const imageSize = process.env.AVALAI_IMAGE_SIZE || "2K";
const aspectRatio = process.env.AVALAI_ASPECT_RATIO || "1:1";
const prompt =
  process.env.AVALAI_TEST_PROMPT ||
  "A premium studio catalog photo of a delicate gold ring on a clean light gray background, realistic jewelry photography, crisp reflections.";

console.log(`Avalai URL: ${baseURL.replace(/\/$/, "")}/chat/completions`);
console.log(`Model: ${model}`);
console.log(`Image config: ${imageSize} / ${aspectRatio}`);

if (!apiKey) {
  console.error("AVALAI_API_KEY is not set.");
  process.exit(1);
}

try {
  const response = await fetch(`${baseURL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      modalities: ["image", "text"],
      extra_body: {
        generationConfig: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      },
    }),
  });

  const requestId = normalizeRequestId(response.headers.get("x-request-id") || response.headers.get("x-request-ids"));
  const body = await response.json().catch(async () => ({ raw: await response.text() }));
  console.log(`Status: ${response.status}`);
  if (requestId) {
    console.log(`Request ID: ${requestId}`);
  }

  if (!response.ok) {
    console.error(JSON.stringify(body, null, 2).slice(0, 2000));
    process.exit(1);
  }

  const imageUrl = body?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const image = parseDataUrl(imageUrl);
  if (!image) {
    console.error("Avalai response did not include an inline image.");
    console.error(JSON.stringify(body, null, 2).slice(0, 2000));
    process.exit(1);
  }

  const outDir = path.join(".local-storage");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `avalai-test-${Date.now()}.${extensionFromMimeType(image.mimeType)}`);
  await writeFile(outPath, image.buffer);
  console.log(`Saved: ${outPath}`);
  console.log(`Bytes: ${image.buffer.length}`);

  const cost = await fetchCostWithRetry({ userBaseURL, apiKey, requestId }).catch(() => null);
  if (cost) {
    console.log(`Cost: ${JSON.stringify(cost)}`);
  }
} catch (error) {
  console.error("Avalai request failed.");
  console.error(error);
  process.exit(1);
}
