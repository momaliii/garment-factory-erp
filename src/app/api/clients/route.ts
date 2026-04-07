import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب العملاء" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, address, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "اسم العميل مطلوب" },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        name,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
      },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Clients POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة العميل" },
      { status: 500 }
    );
  }
}
