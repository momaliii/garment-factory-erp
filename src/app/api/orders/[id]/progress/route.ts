import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayString } from "@/lib/utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { produced, delivered, notes, date } = body;

    if (produced == null && delivered == null) {
      return NextResponse.json(
        { error: "يجب إدخال كمية الإنتاج أو التسليم" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json(
        { error: "الأوردر غير موجود" },
        { status: 404 }
      );
    }

    const progress = await prisma.orderProgress.create({
      data: {
        orderId: id,
        date: date || todayString(),
        produced: parseInt(produced) || 0,
        delivered: parseInt(delivered) || 0,
        notes: notes || null,
      },
    });

    const allProgress = await prisma.orderProgress.findMany({
      where: { orderId: id },
    });
    const totalProduced = allProgress.reduce((s: number, p: { produced: number }) => s + p.produced, 0);

    let newStatus = order.status;
    if (totalProduced >= order.totalQuantity && order.status !== "delivered") {
      newStatus = "completed";
    } else if (order.status === "new" && totalProduced > 0) {
      newStatus = "in_progress";
    }

    if (newStatus !== order.status) {
      await prisma.order.update({
        where: { id },
        data: { status: newStatus },
      });
    }

    return NextResponse.json(progress, { status: 201 });
  } catch (error) {
    console.error("Order progress POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة التقدم" },
      { status: 500 }
    );
  }
}
