import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const cloudflareConfig = defineCloudflareConfig();

const config = {
  ...cloudflareConfig,
  buildCommand: "npm run build:next",
};

export default config;
