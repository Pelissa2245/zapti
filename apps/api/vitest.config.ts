/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/test/', '**/*.d.ts'],
    },
    pool: 'forks',
    isolate: true,
    testTimeout: 30000,
    logHeapUsage: true,
    hookTimeout: 30000,
    teardownTimeout: 30000,
  },
  resolve: {
    alias: {
      '@zapti/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@zapti/database': path.resolve(__dirname, '../../packages/database/src'),
    },
  },
});