import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sanity from "@sanity/astro";
import { loadEnv } from "vite";

const requireEnv = (env, key) => {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    site: "https://chanelleadams.info",
    trailingSlash: "never",
    build: {
      format: "file"
    },
    integrations: [
      sanity({
        projectId: requireEnv(env, "PUBLIC_SANITY_PROJECT_ID"),
        dataset: requireEnv(env, "PUBLIC_SANITY_DATASET"),
        apiVersion: requireEnv(env, "PUBLIC_SANITY_API_VERSION"),
        useCdn: false,
        studioBasePath: "/studio"
      }),
      react()
    ]
  };
});
