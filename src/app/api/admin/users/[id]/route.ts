import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

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
    const { username, name, roleId, employeeId, password } = body;

    const data: Record<string, unknown> = {};
    if (username !== undefined) data.username = username;
    if (name !== undefined) data.name = name;
    if (roleId !== undefined) data.roleId = roleId;
    if (employeeId !== undefined) data.employeeId = employeeId || null;
    if (password) data.password = await bcrypt.hash(password, 10);

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("User PUT error:", error);
    return NextResponse.json({ error: "حدث خطأ في تعديل المستخدم" }, { status: 500 });
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

    if (id === session.user.userId) {
      return NextResponse.json({ error: "لا يمكنك حذف حسابك الخاص" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف المستخدم" });
  } catch (error) {
    console.error("User DELETE error:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف المستخدم" }, { status: 500 });
  }
}
