import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stops `next dev` from writing its own block into AGENTS.md. That file is maintained by the team.
  agentRules: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
