import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

const adapter = new PrismaPg({
  connectionString,
});

const globalForPrisma = globalThis;

if (globalForPrisma.prisma && (!globalForPrisma.prisma.notificationAlert || !globalForPrisma.prisma.frontendProject)) {
  console.log("🔄 Next.js dev cache has an out-of-sync Prisma instance (missing notificationAlert or frontendProject). Recreating client...");
  globalForPrisma.prisma = undefined;
}


export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

import "@/core/listeners";

export default prisma;
