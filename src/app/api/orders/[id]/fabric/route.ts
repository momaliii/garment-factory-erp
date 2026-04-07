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
    const { fabricType, quantity, unit, date, notes } = body;

    if (!quantity) {
      return NextResponse.json(
        { error: "الكمية مطلوبة" },
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

    const record = await prisma.fabricReceiving.create({
      data: {
        orderId: id,
        date: date || todayString(),
        fabricType: fabricType || null,
        quantity: parseFloat(quantity),
        unit: unit || "meter",
        notes: notes || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Fabric receiving POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تسجيل استلام القماش" },
      { status: 500 }
    );
  }
}
