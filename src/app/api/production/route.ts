import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = {};

    if (date) {
      where.date = date;
    } else if (month) {
      where.date = { startsWith: month };
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const records = await prisma.dailyProduction.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, role: true } },
        order: { select: { id: true, description: true, type: true, client: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Production GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات الإنتاج" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, orderId, date, quantity, notes } = body;

    if (!employeeId || !date || !quantity) {
      return NextResponse.json(
        { error: "الموظف والتاريخ والكمية مطلوبين" },
        { status: 400 }
      );
    }

    const record = await prisma.dailyProduction.create({
      data: {
        employeeId,
        orderId: orderId || null,
        date,
        quantity: parseInt(quantity),
        notes: notes || null,
      },
      include: {
        employee: { select: { id: true, name: true, role: true } },
        order: { select: { id: true, description: true, type: true, client: { select: { name: true } } } },
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Production POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة سجل الإنتاج" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, employeeId, orderId, date, quantity, notes } = body;

    if (!id) {
      return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 });
    }

    const record = await prisma.dailyProduction.update({
      where: { id },
      data: {
        employeeId,
        orderId: orderId || null,
        date,
        quantity: parseInt(quantity),
        notes: notes || null,
      },
      include: {
        employee: { select: { id: true, name: true, role: true } },
        order: { select: { id: true, description: true, type: true, client: { select: { name: true } } } },
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Production PUT error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تعديل سجل الإنتاج" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "المعرف مطلوب" }, { status: 400 });
    }

    await prisma.dailyProduction.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف السجل" });
  } catch (error) {
    console.error("Production DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف السجل" },
      { status: 500 }
    );
  }
}
