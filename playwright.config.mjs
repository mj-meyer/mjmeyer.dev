import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  retries: 0,
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4322",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
  ],
  webServer: {
    command: "python3 -m http.server 4322 --bind 127.0.0.1 --directory dist",
    url: "http://127.0.0.1:4322",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
