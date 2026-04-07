import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.admin) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users GET error:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب المستخدمين" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.admin) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const body = await request.json();
    const { username, password, name, roleId, employeeId } = body;

    if (!username || !password || !name || !roleId) {
      return NextResponse.json({ error: "جميع الحقول المطلوبة يجب ملؤها" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        roleId,
        employeeId: employeeId || null,
      },
      include: { role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Users POST error:", error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء المستخدم" }, { status: 500 });
  }
}
