import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.admin) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { name, label, permissions: rolePermissions } = body;

    const existing = await prisma.role.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });
    }

    if (existing.isSystem && name && name !== existing.name) {
      return NextResponse.json({ error: "لا يمكن تغيير اسم دور النظام" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (label !== undefined) data.label = label;
    if (rolePermissions !== undefined) data.permissions = JSON.stringify(rolePermissions);

    const role = await prisma.role.update({ where: { id }, data });

    return NextResponse.json(role);
  } catch (error) {
    console.error("Role PUT error:", error);
    return NextResponse.json({ error: "حدث خطأ في تعديل الدور" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.admin) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const { id } = await params;

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });

    if (!role) {
      return NextResponse.json({ error: "الدور غير موجود" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json({ error: "لا يمكن حذف دور النظام" }, { status: 400 });
    }

    if (role._count.users > 0) {
      return NextResponse.json({ error: "لا يمكن حذف دور مرتبط بمستخدمين" }, { status: 400 });
    }

    await prisma.role.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الدور" });
  } catch (error) {
    console.error("Role DELETE error:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف الدور" }, { status: 500 });
  }
}
