import { defineConfig } from '@playwright/test';

/**
 * E2E contra los servidores reales: reutiliza backend (:3000) y preview (:4321)
 * si ya corren; si no, los arranca (el preview debe servir `dist` recién
 * construido — ver script `test:e2e`).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Los tests comparten la MISMA base de datos de desarrollo (se crean y
  // editan usuarios, ponencias y asistencias); en paralelo hay carreras, p. ej.
  // el test admin desactiva/restaura un usuario mientras otro test entra con
  // ese mismo usuario. Se ejecutan en serie para que sea determinista.
  workers: 1,
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
      // Puerto en vez de URL: el backend puede montarse bajo BASE_PATH
      // (p. ej. /td2026) y /health no sería representativo.
      command: 'npm run dev',
      cwd: '../backend',
      port: 3000,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
