#!/usr/bin/env node
// Generate dist/sitemap.xml from dist/*.html — keep priorities in sync automatically.
// Usage: node scripts/generate-sitemap.mjs          # write file
//        node scripts/generate-sitemap.mjs --check  # exit 1 if stale (CI)
//        node scripts/generate-sitemap.mjs --dry      # print to stdout
import fs from "node:fs";
import path from "node:path";

const DIST = "dist";
const OUT = path.join(DIST, "sitemap.xml");
const BASE = "https://matchmyjathakam.com";

// Per-page config matching current sitemap.xml. Unknown pages get 0.6 monthly.
const PAGE_META = {
  "index.html":        { changefreq: "weekly",  priority: "1.0" },
  "best-matches.html": { changefreq: "monthly", priority: "0.8" },
  "kootas.html":       { changefreq: "monthly", priority: "0.8" },
  "gunalu.html":       { changefreq: "monthly", priority: "0.7" },
  "how-to-match.html": { changefreq: "monthly", priority: "0.7" },
  "nakshatras.html":   { changefreq: "monthly", priority: "0.7" },
  "rasi.html":         { changefreq: "monthly", priority: "0.6" },
  "about.html":        { changefreq: "monthly", priority: "0.6" },
  "nadi-dosha.html":   { changefreq: "monthly", priority: "0.6" },
  "explain.html":      { changefreq: "monthly", priority: "0.5" },
  "privacy.html":      { changefreq: "yearly",  priority: "0.3" },
  "disclaimer.html":   { changefreq: "yearly",  priority: "0.3" },
  "terms.html":        { changefreq: "yearly",  priority: "0.3" },
  "contact.html":      { changefreq: "yearly",  priority: "0.3" },
};

// Extra URLs not backed by a HTML file (kept from current sitemap). Add here as needed.
const EXTRA_URLS = [
  { loc: `${BASE}/results?g=1&amp;b=2`, changefreq: "monthly", priority: "0.4" },
];

function buildXml() {
  const files = fs
    .readdirSync(DIST)
    .filter((f) => f.endsWith(".html"))
    .sort((a, b) => {
      if (a === "index.html") return -1;
      if (b === "index.html") return 1;
      return a.localeCompare(b);
    });

  const lines = [];
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`);

  for (const file of files) {
    const meta = PAGE_META[file] ?? { changefreq: "monthly", priority: "0.6" };
    const loc = file === "index.html" ? `${BASE}/` : `${BASE}/${file}`;
    lines.push(`  <url><loc>${loc}</loc><changefreq>${meta.changefreq}</changefreq><priority>${meta.priority}</priority></url>`);
  }
  for (const extra of EXTRA_URLS) {
    lines.push(`  <url><loc>${extra.loc}</loc><changefreq>${extra.changefreq}</changefreq><priority>${extra.priority}</priority></url>`);
  }
  lines.push(`</urlset>`);
  return lines.join("\n") + "\n";
}

const xml = buildXml();
const args = process.argv.slice(2);

if (args.includes("--dry")) {
  process.stdout.write(xml);
} else if (args.includes("--check")) {
  const currentRaw = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  const current = currentRaw.replace(/\r\n/g, "\n");
  if (current !== xml) {
    console.error("sitemap.xml is out of date. Run: node scripts/generate-sitemap.mjs");
    // show diff hint
    const curLines = current.split("\n");
    const newLines = xml.split("\n");
    const max = Math.max(curLines.length, newLines.length);
    for (let i = 0; i < max; i++) {
      if (curLines[i] !== newLines[i]) {
        console.error(`  line ${i + 1} expected: ${JSON.stringify(newLines[i])}`);
        console.error(`  line ${i + 1} actual  : ${JSON.stringify(curLines[i])}`);
        break;
      }
    }
    process.exit(1);
  } else {
    console.log("sitemap.xml up to date");
  }
} else {
  fs.writeFileSync(OUT, xml, "utf8");
  console.log(`Wrote ${OUT} (${xml.split("\n").length - 1} lines, ${fs.readdirSync(DIST).filter((f) => f.endsWith(".html")).length} pages)`);
}
