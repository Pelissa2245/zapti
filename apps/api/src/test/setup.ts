// Test setup file
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? ['error', 'warn'] : [],
});

// Global test setup
beforeAll(async () => {
  // Ensure database connection
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Clean up between tests
beforeEach(async () => {
  // Clean tables if needed
});

afterEach(async () => {
  // Additional cleanup
});

// Mock environment variables for tests
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-min-32-chars-long';
// Use localhost to connect to Docker PostgreSQL from Windows host
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/zapti';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
// NODE_ENV is read-only in Node.js, so we can't set it directly
// process.env.NODE_ENV = 'test';

// Suppress metrics during tests
process.env.DISABLE_METRICS = 'true';