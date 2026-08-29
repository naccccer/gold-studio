import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/(dashboard)/projects/new/page.tsx", import.meta.url), "utf8");

assert.match(page, /selectedGalleryAsset/);
assert.match(page, /id: params\.assetId/);
assert.match(page, /userId: session\.userId/);
assert.match(page, /vertical,/);
assert.match(page, /status: "READY"/);
assert.match(page, /archivedAt: null/);
assert.match(page, /resolvedGalleryAssets/);
assert.match(page, /galleryAssets=\{resolvedGalleryAssets\.map/);

console.log("NEW_PROJECT_SELECTION_CHECK_OK");
