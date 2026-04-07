import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.admin) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const roles = await prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "asc" },
    });

    const parsed = roles.map((r) => ({
      ...r,
      permissions: JSON.parse(r.permissions),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Roles GET error:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب الأدوار" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.admin) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const body = await request.json();
    const { name, label, permissions: rolePermissions } = body;

    if (!name || !label || !rolePermissions) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    const role = await prisma.role.create({
      data: {
        name,
        label,
        permissions: JSON.stringify(rolePermissions),
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Roles POST error:", error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء الدور" }, { status: 500 });
  }
}
