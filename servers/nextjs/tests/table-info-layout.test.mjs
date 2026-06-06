import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const layoutPath = path.join(
  __dirname,
  "..",
  "app",
  "presentation-templates",
  "general",
  "TableInfoSlideLayout.tsx",
);
const source = readFileSync(layoutPath, "utf8");

test("general table-info slide keeps exported table cell text non-wrapping", () => {
  assert.match(source, /const tableTextClass =/);
  assert.match(source, /w-full whitespace-nowrap break-normal/);
  assert.match(source, /\[overflow-wrap:normal\]/);
  assert.match(source, /\[word-break:normal\]/);
  assert.match(source, /<span className=\{tableTextClass\}>\{header\}<\/span>/);
  assert.match(source, /<span className=\{tableTextClass\}>\{cell\}<\/span>/);
});
