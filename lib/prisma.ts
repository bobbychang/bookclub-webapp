import { PrismaClient } from '@prisma/client';

const ensureSupabasePoolerCompatibility = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.includes('pgbouncer=true')) return;

  try {
    const url = new URL(databaseUrl);

    if (url.hostname.includes('pooler.supabase.com')) {
      url.searchParams.set('pgbouncer', 'true');
      process.env.DATABASE_URL = url.toString();
    }
  } catch {
    // Prisma will surface malformed DATABASE_URL values with its own error.
  }
};

const prismaClientSingleton = () => {
  ensureSupabasePoolerCompatibility();
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
