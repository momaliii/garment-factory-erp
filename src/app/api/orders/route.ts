import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        client: { select: { id: true, name: true } },
        orderProgress: {
          select: { produced: true, delivered: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = orders.map((order: typeof orders[number]) => {
      const totalProduced = order.orderProgress.reduce(
        (sum: number, p: { produced: number }) => sum + p.produced,
        0
      );
      const totalDelivered = order.orderProgress.reduce(
        (sum: number, p: { delivered: number }) => sum + p.delivered,
        0
      );
      const remaining = order.totalQuantity - totalProduced;

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const deadline = new Date(order.deadline);
      deadline.setHours(0, 0, 0, 0);
      const daysLeft = Math.ceil(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...order,
        totalProduced,
        totalDelivered,
        remaining,
        daysLeft,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الأوردرات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, type, description, totalQuantity, unitPrice, deadline, notes } =
      body;

    if (!clientId || !type || !totalQuantity || !unitPrice || !deadline) {
      return NextResponse.json(
        { error: "جميع الحقول المطلوبة يجب ملؤها" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        clientId,
        type,
        description: description || null,
        totalQuantity: parseInt(totalQuantity),
        unitPrice: parseFloat(unitPrice),
        deadline,
        notes: notes || null,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Orders POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة الأوردر" },
      { status: 500 }
    );
  }
}
