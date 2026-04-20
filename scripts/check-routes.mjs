import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

const expectedFiles = [
  "index.html",
  "bio.html",
  "contact.html",
  "cut-paste.html",
  "cv.html",
  "pharmacy.html",
  "Material-Ends-and-Invisible-Portals.html",
  "studio/index.html",
  "static"
];

for (const file of expectedFiles) {
  await fs.access(path.join(distDir, file));
}

console.log(JSON.stringify({ distDir, checked: expectedFiles.length }, null, 2));
