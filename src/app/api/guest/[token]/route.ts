import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const link = await prisma.guestLink.findUnique({ where: { token } });

    if (!link) {
      return NextResponse.json({ valid: false, reason: "رابط غير موجود" });
    }

    if (!link.isActive) {
      return NextResponse.json({ valid: false, reason: "الرابط معطل" });
    }

    if (new Date(link.expiresAt) <= new Date()) {
      return NextResponse.json({ valid: false, reason: "الرابط منتهي الصلاحية" });
    }

    if (link.maxVisits !== null && link.visitCount >= link.maxVisits) {
      return NextResponse.json({ valid: false, reason: "تم تجاوز الحد الأقصى للزيارات" });
    }

    await prisma.guestLink.update({
      where: { id: link.id },
      data: { visitCount: { increment: 1 } },
    });

    return NextResponse.json({
      valid: true,
      permissions: JSON.parse(link.permissions),
    });
  } catch (error) {
    console.error("Guest token GET error:", error);
    return NextResponse.json({ error: "حدث خطأ في التحقق من الرابط" }, { status: 500 });
  }
}
