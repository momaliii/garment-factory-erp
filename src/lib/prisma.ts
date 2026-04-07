import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  if (process.env.DB_HOST && process.env.DB_HOST !== "localhost_disabled") {
    // Production: MySQL via MariaDB adapter
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
    const adapter = new PrismaMariaDb({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    return new PrismaClient({ adapter });
  }

  // Local development: SQLite
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const path = require("path");
  const dbPath = path.resolve(process.cwd(), "dev.db");
  const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
