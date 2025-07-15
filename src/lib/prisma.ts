// 1. Update your src/lib/prisma.ts file to properly handle connections

import { PrismaClient } from "@prisma/client";
import { withAccelerate as _withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ FIX: Create Prisma client with proper connection handling
const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// ✅ FIX: Ensure connection is established
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// ✅ FIX: Connect to database on startup
prisma.$connect().catch((error) => {
  console.error('❌ Failed to connect to database:', error);
});

// ✅ FIX: Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});