import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { machine: true },
    });

    if (!employee) {
      return NextResponse.json({ error: "الموظف غير موجود" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Employee GET error:", error);
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
    const { name, role, phone, baseSalary, paymentType, machineId } = body;

    if (!name || !role || baseSalary == null) {
      return NextResponse.json(
        { error: "الاسم والوظيفة والمرتب الأساسي مطلوبين" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        role,
        phone: phone || null,
        baseSalary: Number(baseSalary),
        paymentType: paymentType || "monthly",
        machineId: machineId || null,
      },
      include: { machine: true },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("Employee PUT error:", error);
    return NextResponse.json({ error: "حدث خطأ في تعديل الموظف" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "تم تعطيل الموظف" });
  } catch (error) {
    console.error("Employee DELETE error:", error);
    return NextResponse.json({ error: "حدث خطأ في حذف الموظف" }, { status: 500 });
  }
}
