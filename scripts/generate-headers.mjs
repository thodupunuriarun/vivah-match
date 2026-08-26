#!/usr/bin/env node
// Generate dist/_headers — ensures every JS/CSS asset has immutable cache.
// Usage: node scripts/generate-headers.mjs          # write file
//        node scripts/generate-headers.mjs --check  # exit 1 if stale
//        node scripts/generate-headers.mjs --dry     # print stdout
import fs from "node:fs";
import path from "node:path";

const OUT = "dist/_headers";

function buildHeaders() {
  const jsFiles = fs
    .readdirSync("dist")
    .filter((f) => f.endsWith(".js"))
    .sort();
  const cssFiles = fs
    .readdirSync("dist")
    .filter((f) => f.endsWith(".css"))
    .sort();

  const lines = [];
  lines.push("/*");
  lines.push("  X-Content-Type-Options: nosniff");
  lines.push("  X-Frame-Options: DENY");
  lines.push("  Referrer-Policy: strict-origin-when-cross-origin");
  lines.push("  Permissions-Policy: camera=(), microphone=(), geolocation=()");
  lines.push("");
  lines.push("/vendor/*");
  lines.push("  Cache-Control: public, max-age=31536000, immutable");
  lines.push("");
  lines.push("/*.wasm");
  lines.push("  Cache-Control: public, max-age=31536000, immutable");
  lines.push("  Content-Type: application/wasm");
  lines.push("");
  lines.push("/og-image.*");
  lines.push("  Cache-Control: public, max-age=86400");
  lines.push("  Content-Type: image/svg+xml");
  for (const f of [...cssFiles, ...jsFiles]) {
    lines.push("");
    lines.push(`/${f}`);
    lines.push("  Cache-Control: public, max-age=31536000, immutable");
  }
  return lines.join("\n") + "\n";
}

const out = buildHeaders();
const args = process.argv.slice(2);

if (args.includes("--dry")) {
  process.stdout.write(out);
} else if (args.includes("--check")) {
  const currentRaw = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  const current = currentRaw.replace(/\r\n/g, "\n");
  if (current !== out) {
    console.error("_headers is out of date. Run: node scripts/generate-headers.mjs");
    const curLines = current.split("\n");
    const newLines = out.split("\n");
    for (let i = 0; i < Math.max(curLines.length, newLines.length); i++) {
      if (curLines[i] !== newLines[i]) {
        console.error(`  line ${i + 1} expected: ${JSON.stringify(newLines[i])}`);
        console.error(`  line ${i + 1} actual  : ${JSON.stringify(curLines[i])}`);
        break;
      }
    }
    process.exit(1);
  } else {
    console.log("_headers up to date");
  }
} else {
  fs.writeFileSync(OUT, out, "utf8");
  console.log(`Wrote ${OUT} (${out.split("\n").length} lines, ${fs.readdirSync("dist").filter((f) => f.endsWith(".js")).length} js + ${fs.readdirSync("dist").filter((f) => f.endsWith(".css")).length} css)`);
}
