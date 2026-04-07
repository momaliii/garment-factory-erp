import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const action = searchParams.get("action");
    const take = parseInt(searchParams.get("take") || "100");

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("AuditLog GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
