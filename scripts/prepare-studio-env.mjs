import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error("PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET must be set.");
}

const outputPath = path.join(rootDir, "sanity", "studioEnv.generated.ts");
const output = `export const studioProjectId = ${JSON.stringify(projectId)};\nexport const studioDataset = ${JSON.stringify(dataset)};\n`;

await fs.writeFile(outputPath, output, "utf8");

console.log(JSON.stringify({ outputPath, projectId, dataset }, null, 2));
