import { defineConfig } from 'vitest/config'

// Migrated to ESM (.mjs) to avoid ERR_REQUIRE_ESM when Vitest loads Vite (which is ESM only).
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.js',
        '**/*.config.ts'
      ]
    }
  }
})
