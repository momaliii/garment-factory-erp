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

    const { id } = await params;
    const body = await request.json();

    const updated = await prisma.revenue.update({
      where: { id },
      data: {
        ...(body.categoryId && { categoryId: body.categoryId }),
        ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.date && { date: body.date }),
        ...(body.orderId !== undefined && { orderId: body.orderId || null }),
      },
      include: { category: true },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Revenue PUT error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { id } = await params;
    await prisma.revenue.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Revenue DELETE error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
