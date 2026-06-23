import { performBackup, loadEnvFile } from "./backup-core.mjs";

loadEnvFile();
loadEnvFile(".env.local");

function argValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const source = argValue("source", "manual");
const actorAdminId = argValue("actorAdminId", "") || null;

try {
  const result = await performBackup({ source, actorAdminId });
  console.log(`BACKUP_RESULT ${JSON.stringify({
    fileName: result.fileName,
    sizeBytes: result.sizeBytes,
    sha256: result.sha256,
  })}`);
} catch (error) {
  console.error("BACKUP_FAILED", error instanceof Error ? error.message : error);
  process.exit(1);
}
