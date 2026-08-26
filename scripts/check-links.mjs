#!/usr/bin/env node
// Verify internal links in dist/*.html point to existing files.
// Fails CI if broken link found — catches missing pages before deploy.
import fs from "node:fs";
import path from "node:path";

const DIST = "dist";
const htmlFiles = fs.readdirSync(DIST).filter((f) => f.endsWith(".html"));
const existing = new Set(htmlFiles.map((f) => `/${f}`).concat(["/"]));
// Also allow known non-file routes handled by _redirects / app logic
const allowed = new Set([
  "/results", "/results/", "/sitemap.xml", "/robots.txt", "/ads.txt", "/favicon.svg",
  "/style.css", "/app.js", "/decor.js", "/rashi.js", "/best-matches.js", "/explain.js",
  "/og-image.png", "/og-image.svg",
  // external query-style result URLs are ok (handled client-side)
]);

let broken = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(DIST, file), "utf8");
  // find href="..." and src="..."
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  const srcs = [...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1]);
  for (const raw of [...hrefs, ...srcs]) {
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("//") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("#") || raw.startsWith("data:")) continue;
    // strip query/hash
    const clean = raw.split("?")[0].split("#")[0];
    if (!clean || clean.startsWith("vendor/") || clean.startsWith("data/")) continue;
    // normalize /foo.html stay, /foo -> /foo.html? Check both
    if (clean === "/" || clean === "") continue;
    if (allowed.has(clean) || allowed.has(clean + "/")) continue;
    // allow results?g= style — check prefix
    if (clean.startsWith("/results")) continue;
    // check file exists
    const asFile = clean.startsWith("/") ? clean.slice(1) : clean;
    // try as-is and with .html
    const candidates = [asFile, asFile + ".html", path.join(asFile, "index.html")];
    const exists = candidates.some((c) => fs.existsSync(path.join(DIST, c)));
    if (!exists && !existing.has(clean)) {
      console.error(`Broken link in ${file}: "${raw}" -> "${clean}" not found`);
      broken++;
    }
  }
}

if (broken) {
  console.error(`\n${broken} broken link(s) found`);
  process.exit(1);
} else {
  console.log(`Links OK — checked ${htmlFiles.length} pages`);
}
