import { PrismaClient } from "@/generated/prisma/client";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function parseDbUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace("/", ""),
  };
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith("mysql://")) {
    const config = parseDbUrl(dbUrl);
    const adapter = new PrismaMariaDb(config);
    return new PrismaClient({ adapter });
  }

  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  return new PrismaClient({ adapter });
}

export const prisma =
  globalForPrisma.prisma ?? createPrismaClient();

// Reuse one client per Node process (dev + prod) to avoid extra DB connections
globalForPrisma.prisma = prisma;
