const fs = require("fs");
const path = require("path");

try {
  const src = require.resolve("sql.js/dist/sql-wasm.wasm");
  const dst = path.join(__dirname, "..", "sql-wasm.wasm");
  fs.copyFileSync(src, dst);
  console.log("Copied sql-wasm.wasm to plugin root");
} catch (e) {
  console.error("Failed to copy sql-wasm.wasm:", e && e.message ? e.message : e);
  process.exitCode = 0;
}
