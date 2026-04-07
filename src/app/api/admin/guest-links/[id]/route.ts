import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const permissions = session.user.permissions as Record<string, unknown>;
    if (!permissions.guest_links) return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const { id } = await params;

    await prisma.guestLink.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "تم تعطيل الرابط" });
  } catch (error) {
    console.error("GuestLink DELETE error:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف الرابط" }, { status: 500 });
  }
}
