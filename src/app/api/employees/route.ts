import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where = active === "true" ? { isActive: true } : {};

    const employees = await prisma.employee.findMany({
      where,
      include: { machine: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Employees GET error:", error);
    return NextResponse.json({ error: "حدث خطأ في جلب الموظفين" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, role, phone, baseSalary, paymentType, machineId } = body;

    if (!name || !role || baseSalary == null) {
      return NextResponse.json(
        { error: "الاسم والوظيفة والمرتب الأساسي مطلوبين" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
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

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("Employees POST error:", error);
    return NextResponse.json({ error: "حدث خطأ في إضافة الموظف" }, { status: 500 });
  }
}
