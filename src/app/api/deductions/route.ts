import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (month) {
      where.date = {
        gte: `${month}-01`,
        lte: `${month}-31`,
      };
    }

    const deductions = await prisma.deduction.findMany({
      where,
      include: { employee: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(deductions);
  } catch (error) {
    console.error("Deductions GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الخصومات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, type, amount, reason, date } = body;

    if (!employeeId || !type || amount == null || !date) {
      return NextResponse.json(
        { error: "الموظف والنوع والمبلغ والتاريخ مطلوبين" },
        { status: 400 }
      );
    }

    const deduction = await prisma.deduction.create({
      data: {
        employeeId,
        type,
        amount: Number(amount),
        reason: reason || null,
        date,
      },
      include: { employee: true },
    });

    return NextResponse.json(deduction, { status: 201 });
  } catch (error) {
    console.error("Deductions POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة الخصم" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "معرف الخصم مطلوب" },
        { status: 400 }
      );
    }

    await prisma.deduction.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف الخصم" });
  } catch (error) {
    console.error("Deductions DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف الخصم" },
      { status: 500 }
    );
  }
}
