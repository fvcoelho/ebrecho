import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  // For serverless environments, use connection pooling with proper limits
  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';
  
  // Adjust database URL for serverless if needed
  let databaseUrl = process.env.DATABASE_URL || '';
  
  // Ensure connection pooling parameters for serverless
  if (isVercel && !databaseUrl.includes('pgbouncer=true')) {
    const separator = databaseUrl.includes('?') ? '&' : '?';
    databaseUrl = `${databaseUrl}${separator}pgbouncer=true&connection_limit=3&pool_timeout=60&connect_timeout=30`;
  }
  
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: isProduction ? ['error'] : ['error', 'warn'],
    // Serverless optimizations
    ...(isVercel && {
      errorFormat: 'minimal',
    }),
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

// Only cache in development to avoid connection issues
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
}

// Graceful shutdown for serverless
if (process.env.VERCEL === '1') {
  // Don't keep connections alive in serverless
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}