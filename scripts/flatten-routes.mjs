import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const studioStaticDir = path.join(distDir, "studio", "static");
const rootStaticDir = path.join(distDir, "static");

const routeNames = [
  "bio",
  "contact",
  "cut-paste",
  "cv",
  "pharmacy",
  "Material-Ends-and-Invisible-Portals"
];

for (const routeName of routeNames) {
  const sourceFile = path.join(distDir, routeName, "index.html");
  const targetFile = path.join(distDir, `${routeName}.html`);

  await fs.copyFile(sourceFile, targetFile);
  await fs.rm(path.join(distDir, routeName), { recursive: true, force: true });
}

// Sanity Studio's built HTML resolves its bundle from `/static/*`.
// Mirror the Studio bundle to the site root so `/studio/` works in preview and production.
await fs.rm(rootStaticDir, { recursive: true, force: true });
await fs.cp(studioStaticDir, rootStaticDir, { recursive: true });

console.log(JSON.stringify({ flattened: routeNames.length, syncedStudioStatic: true }, null, 2));
