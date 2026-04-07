import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, attendanceBonus, productionBonus, totalDeductions } =
      body;

    const existing = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "سجل المرتب غير موجود" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (attendanceBonus !== undefined)
      updateData.attendanceBonus = Number(attendanceBonus);
    if (productionBonus !== undefined)
      updateData.productionBonus = Number(productionBonus);
    if (totalDeductions !== undefined)
      updateData.totalDeductions = Number(totalDeductions);

    if (
      attendanceBonus !== undefined ||
      productionBonus !== undefined ||
      totalDeductions !== undefined
    ) {
      const ab =
        attendanceBonus !== undefined
          ? Number(attendanceBonus)
          : existing.attendanceBonus;
      const pb =
        productionBonus !== undefined
          ? Number(productionBonus)
          : existing.productionBonus;
      const td =
        totalDeductions !== undefined
          ? Number(totalDeductions)
          : existing.totalDeductions;
      updateData.netSalary = existing.baseSalary + ab + pb - td;
    }

    const record = await prisma.payrollRecord.update({
      where: { id },
      data: updateData,
      include: { employee: true, deductions: true },
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error("Payroll PUT error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تعديل سجل المرتب" },
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

    await prisma.deduction.updateMany({
      where: { payrollId: id },
      data: { payrollId: null },
    });

    await prisma.payrollRecord.delete({ where: { id } });

    return NextResponse.json({ message: "تم حذف سجل المرتب" });
  } catch (error) {
    console.error("Payroll DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف سجل المرتب" },
      { status: 500 }
    );
  }
}
