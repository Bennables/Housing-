import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

// E2E creates users and posts, so it must run against a throwaway database.
// Put the test branch connection strings in .env.test.local (never in .env.local).
config({ path: ".env.test.local", override: true });

const port = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_URL: `http://localhost:${port}`,
      AUTH_TRUST_HOST: "true",
    },
  },
});
