import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/storage-access-policy.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const loadedModule = { exports: {} };
vm.runInNewContext(`(function(module,exports){${compiled}\n})(loadedModule,loadedModule.exports)`, { loadedModule });
const { authorizeStorageKeyAccess, storageOwnershipKind } = loadedModule.exports;

assert.equal(storageOwnershipKind("uploads/source/a.jpg"), "source");
assert.equal(storageOwnershipKind("uploads/result/a.jpg"), "result");
assert.equal(storageOwnershipKind("uploads/style-references/a.jpg"), "style-reference");
assert.equal(storageOwnershipKind("uploads/receipts/a.jpg"), "receipt");
assert.equal(storageOwnershipKind("uploads/unknown/a.jpg"), null);

const storageKey = "uploads/result/a.jpg";
const owner = { userId: "owner", role: "USER" };
const other = { userId: "other", role: "USER" };
const owns = async (_kind, userId) => userId === "owner";

assert.equal(await authorizeStorageKeyAccess({ storageKey, publicAccess: false, session: owner, owns }), true);
assert.equal(await authorizeStorageKeyAccess({ storageKey, publicAccess: false, session: other, owns }), false);
assert.equal(await authorizeStorageKeyAccess({ storageKey, publicAccess: false, session: { userId: "admin", role: "ADMIN" }, owns }), true);
assert.equal(await authorizeStorageKeyAccess({ storageKey, publicAccess: false, session: { userId: "sales", role: "SALES" }, owns }), true);
assert.equal(await authorizeStorageKeyAccess({ storageKey, publicAccess: false, session: null, owns }), false);
assert.equal(await authorizeStorageKeyAccess({ storageKey: "uploads/result/missing.jpg", publicAccess: false, session: owner, owns: async () => false }), false);
assert.equal(await authorizeStorageKeyAccess({ storageKey: "uploads/style-previews/public.webp", publicAccess: true, session: null, owns }), true);

console.log("STORAGE_ACCESS_CHECK_OK");
