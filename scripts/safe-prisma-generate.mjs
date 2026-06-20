import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import process from "node:process";

const root = process.cwd();
const generatedDir = join(root, "src", "generated", "prisma");
const markerPath = join(generatedDir, ".generate-hash.json");
const clientEntryPath = join(generatedDir, "client.js");
const hashInputs = [
  "prisma/schema.prisma",
  "prisma.config.ts",
  "package.json",
  "package-lock.json",
];

function isForceRequested() {
  return process.argv.includes("--force") || process.env.FORCE_PRISMA_GENERATE === "1";
}

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function hashPrismaInputs() {
  const hash = createHash("sha256");

  for (const relativePath of hashInputs) {
    if (!(await pathExists(join(root, relativePath)))) {
      continue;
    }

    hash.update(`\n--- ${relativePath} ---\n`);
    hash.update(await readFile(join(root, relativePath)));
  }

  return hash.digest("hex");
}

async function readPreviousHash() {
  try {
    const marker = JSON.parse(await readFile(markerPath, "utf8"));
    return typeof marker.hash === "string" ? marker.hash : null;
  } catch {
    return null;
  }
}

function runPrismaGenerate() {
  return new Promise((resolve) => {
    const prismaCliPath = join(root, "node_modules", "prisma", "build", "index.js");
    const child = spawn(process.execPath, [prismaCliPath, "generate"], {
      cwd: root,
      stdio: "inherit",
      shell: false,
    });

    child.on("exit", (code) => resolve(code ?? 1));
    child.on("error", (error) => {
      console.error(error);
      resolve(1);
    });
  });
}

const force = isForceRequested();
const currentHash = await hashPrismaInputs();
const previousHash = await readPreviousHash();
const hasClient = await pathExists(clientEntryPath);

if (!force && hasClient && previousHash === currentHash) {
  console.log("Prisma Client is current; skipping prisma generate.");
  process.exit(0);
}

const exitCode = await runPrismaGenerate();
if (exitCode !== 0) {
  console.error("\nPrisma generate failed.");
  console.error("On Windows this is often caused by a running Node/Next process locking src/generated/prisma/query_engine-windows.dll.node.");
  console.error("Close the dev server or worker, then run: npm run db:generate -- --force");
  process.exit(exitCode);
}

await mkdir(dirname(markerPath), { recursive: true });
await writeFile(
  markerPath,
  `${JSON.stringify({ hash: currentHash, generatedAt: new Date().toISOString() }, null, 2)}\n`,
);
