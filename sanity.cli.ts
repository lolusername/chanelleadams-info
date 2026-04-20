import "dotenv/config";
import { defineCliConfig } from "sanity/cli";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET;

if (!projectId || !dataset) {
  throw new Error("PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET must be set.");
}

export default defineCliConfig({
  api: {
    projectId,
    dataset
  },
  studioHost: "chanelle",
  deployment: {
    appId: "stfhm41ya0gh7aejpon4z278"
  }
});
