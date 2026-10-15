import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Los specs de `tests/` son de Playwright, no de Vitest.
    exclude: ['tests/**', 'node_modules/**', 'dist/**'],
  },
});
