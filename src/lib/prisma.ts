import { PrismaClient } from "@prisma/client";
import { withAccelerate } from '@prisma/extension-accelerate'

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaWithExtensions> | undefined;
};

const prismaWithExtensions = () => {
  return new PrismaClient({
    log: ["query"],
  }).$extends(withAccelerate());
};

export const prisma = globalForPrisma.prisma ?? prismaWithExtensions();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
