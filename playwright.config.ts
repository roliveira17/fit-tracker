import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração do Playwright para testes E2E do Fit Track
 */
export default defineConfig({
  // Pasta com os testes
  testDir: "./tests/e2e",

  // Timeout por teste
  timeout: 30 * 1000,

  // Retry em caso de falha
  retries: 0,

  // Reporters
  reporter: [["html", { open: "never" }], ["list"]],

  // Configurações compartilhadas
  use: {
    // URL base do app
    baseURL: "http://localhost:3000",

    // Screenshot em caso de falha
    screenshot: "only-on-failure",

    // Trace em caso de falha
    trace: "on-first-retry",

    // Viewport mobile-first
    viewport: { width: 390, height: 844 },
  },

  // Projetos (browsers)
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Servidor de desenvolvimento
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
