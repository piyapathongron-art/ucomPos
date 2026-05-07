import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Next.js auto-loads `.env.local`, but the Prisma CLI runs outside Next.js
// so we have to point dotenv at it explicitly. `.env` is loaded as a fallback.
loadEnv({ path: '.env.local' });
loadEnv();

// In Prisma 7, connection URLs live here instead of `schema.prisma`.
// `DIRECT_URL` is preferred for migrations (bypasses pgbouncer pooling).
// The runtime PrismaClient (lib/prisma.ts) uses the `@prisma/adapter-pg`
// driver adapter and reads `DATABASE_URL` separately.
const migrationUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!migrationUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL must be set in .env.local');
}

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: migrationUrl,
  },
  migrations: {
    path: path.join('prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
});
