import { defineConfig } from '@playwright/test';

/**
 * E2E contra los servidores reales: reutiliza backend (:3000) y preview (:4321)
 * si ya corren; si no, los arranca (el preview debe servir `dist` recién
 * construido — ver script `test:e2e`).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 7_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  webServer: [
    // El preview lo arranca el script `test:e2e` (astro preview se daemoniza y
    // no sirve como webServer de Playwright); aquí solo reutilizamos/revisamos.
    {
      command: 'npm run preview',
      url: 'http://localhost:4321/',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm run dev',
      cwd: '../backend',
      url: 'http://localhost:3000/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
