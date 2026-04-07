import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { parsePermissions, type Permissions } from "./permissions";
import { prisma } from "./prisma";

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
