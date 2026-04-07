import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@/generated/prisma/client";
import bcrypt from "bcryptjs";
import { parsePermissions, type Permissions } from "./permissions";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function createLocalPrisma() {
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  return new PrismaClient({ adapter });
}

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      name: string;
      role: string;
      permissions: Permissions;
      employeeId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    name: string;
    role: string;
    permissions: Permissions;
    employeeId: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "اسم المستخدم", type: "text" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const prisma = createLocalPrisma();
        try {
          const user = await prisma.user.findUnique({
            where: { username: credentials.username },
            include: { role: true },
          });

          if (!user) return null;

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (!isValid) return null;

          return {
            id: user.id,
            name: user.name,
            role: user.role.name,
            permissions: parsePermissions(user.role.permissions),
            employeeId: user.employeeId,
          };
        } finally {
          await prisma.$disconnect();
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; name: string; role: string; permissions: Permissions; employeeId: string | null };
        token.userId = u.id;
        token.name = u.name ?? "";
        token.role = u.role;
        token.permissions = u.permissions;
        token.employeeId = u.employeeId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        userId: token.userId,
        name: token.name,
        role: token.role,
        permissions: token.permissions,
        employeeId: token.employeeId,
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
