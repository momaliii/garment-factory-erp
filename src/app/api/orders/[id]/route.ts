import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, phone: true } },
        orderProgress: { orderBy: { createdAt: "desc" } },
        fabricReceiving: { orderBy: { createdAt: "desc" } },
        dailyProduction: {
          include: {
            employee: { select: { name: true } },
          },
          orderBy: { date: "desc" },
          take: 50,
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "الأوردر غير موجود" },
        { status: 404 }
      );
    }

    const totalProduced = order.orderProgress.reduce(
      (sum: number, p: { produced: number }) => sum + p.produced,
      0
    );
    const totalDelivered = order.orderProgress.reduce(
      (sum: number, p: { delivered: number }) => sum + p.delivered,
      0
    );

    return NextResponse.json({
      ...order,
      totalProduced,
      totalDelivered,
      remaining: order.totalQuantity - totalProduced,
    });
  } catch (error) {
    console.error("Order GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { clientId, type, description, totalQuantity, unitPrice, deadline, status, notes } =
      body;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(clientId && { clientId }),
        ...(type && { type }),
        description: description ?? undefined,
        ...(totalQuantity && { totalQuantity: parseInt(totalQuantity) }),
        ...(unitPrice && { unitPrice: parseFloat(unitPrice) }),
        ...(deadline && { deadline }),
        ...(status && { status }),
        notes: notes ?? undefined,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Order PUT error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تعديل الأوردر" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الأوردر" });
  } catch (error) {
    console.error("Order DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف الأوردر" },
      { status: 500 }
    );
  }
}
