import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentMonth } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || getCurrentMonth();

    const productions = await prisma.dailyProduction.findMany({
      where: { date: { startsWith: month } },
      include: {
        employee: { select: { id: true, name: true, role: true } },
      },
    });

    const employeeMap = new Map<
      string,
      { name: string; role: string; totalQuantity: number; days: Set<string> }
    >();

    let totalFactory = 0;

    for (const p of productions) {
      totalFactory += p.quantity;

      const existing = employeeMap.get(p.employeeId);
      if (existing) {
        existing.totalQuantity += p.quantity;
        existing.days.add(p.date);
      } else {
        employeeMap.set(p.employeeId, {
          name: p.employee.name,
          role: p.employee.role,
          totalQuantity: p.quantity,
          days: new Set([p.date]),
        });
      }
    }

    const employees = Array.from(employeeMap.entries()).map(
      ([id, data]) => ({
        id,
        name: data.name,
        role: data.role,
        totalQuantity: data.totalQuantity,
        daysWorked: data.days.size,
        avgPerDay: data.days.size > 0
          ? Math.round(data.totalQuantity / data.days.size)
          : 0,
      })
    );

    employees.sort((a, b) => b.totalQuantity - a.totalQuantity);

    const topProducer = employees.length > 0 ? employees[0] : null;

    return NextResponse.json({
      month,
      totalFactory,
      employeeCount: employees.length,
      topProducer,
      employees,
    });
  } catch (error) {
    console.error("Production summary error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب ملخص الإنتاج" },
      { status: 500 }
    );
  }
}
