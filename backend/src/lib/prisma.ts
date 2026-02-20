import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  process.exit(0);
};

process.on('beforeExit', shutdown);
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default prisma;
