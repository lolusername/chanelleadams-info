import { deskTool } from "sanity/desk";
import { defineConfig } from "sanity";
import { schemaTypes } from "./sanity/schemaTypes";
import { studioDataset, studioProjectId } from "./sanity/studioEnv.generated";

export default defineConfig({
  name: "default",
  title: "Chanelle Adams",
  projectId: studioProjectId,
  dataset: studioDataset,
  basePath: "/studio",
  plugins: [deskTool()],
  schema: {
    types: schemaTypes
  }
});
