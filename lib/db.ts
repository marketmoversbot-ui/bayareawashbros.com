import { PrismaClient } from "@prisma/client";

// In dev, Next.js hot-reloads can spin up many PrismaClient instances and
// exhaust the database connection pool. Stash a single instance on globalThis.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
