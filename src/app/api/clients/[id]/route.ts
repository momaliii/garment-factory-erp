import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: { orders: true },
    });

    if (!client) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client GET error:", error);
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
    const { name, phone, address, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: "اسم العميل مطلوب" },
        { status: 400 }
      );
    }

    const client = await prisma.client.update({
      where: { id },
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

    return NextResponse.json(client);
  } catch (error) {
    console.error("Client PUT error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تعديل العميل" },
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

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف العميل" });
  } catch (error) {
    console.error("Client DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف العميل" },
      { status: 500 }
    );
  }
}
