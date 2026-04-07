import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.guest_links) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const links = await prisma.guestLink.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("GuestLinks GET error:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب الروابط" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.guest_links) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const body = await request.json();
    const { name, permissions: linkPermissions, expiresAt, maxVisits } = body;

    if (!name || !linkPermissions || !expiresAt) {
      return NextResponse.json({ error: "جميع الحقول المطلوبة يجب ملؤها" }, { status: 400 });
    }

    const link = await prisma.guestLink.create({
      data: {
        token: crypto.randomUUID(),
        name,
        permissions: JSON.stringify(linkPermissions),
        expiresAt: new Date(expiresAt),
        maxVisits: maxVisits ?? null,
        createdById: session.user.userId,
      },
      include: { createdBy: { select: { name: true } } },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("GuestLinks POST error:", error);
    return NextResponse.json({ error: "حدث خطأ في إنشاء الرابط" }, { status: 500 });
  }
}
