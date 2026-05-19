import { readFileSync } from "node:fs";

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

loadDotEnv();

const baseURL = process.env.LIARA_BASE_URL || "https://ai.liara.ir/api/69fe30c50bb427e049d327f6/v1";
const apiKey = process.env.LIARA_API_KEY;
const url = `${baseURL.replace(/\/$/, "")}/models`;

console.log(`Liara URL: ${url}`);
console.log(`http_proxy: ${process.env.http_proxy || process.env.HTTP_PROXY || "(not set)"}`);
console.log(`https_proxy: ${process.env.https_proxy || process.env.HTTPS_PROXY || "(not set)"}`);
console.log(`NO_PROXY: ${process.env.NO_PROXY || process.env.no_proxy || "(not set)"}`);

if (!apiKey) {
  console.error("LIARA_API_KEY is not set.");
  process.exit(1);
}

try {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
  const body = await response.text();
  console.log(`Status: ${response.status}`);
  console.log(body.slice(0, 1000));
  process.exit(response.ok ? 0 : 1);
} catch (error) {
  console.error("Direct Liara request failed.");
  console.error(error);
  process.exit(1);
}
