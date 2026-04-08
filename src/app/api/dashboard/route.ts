import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayString, getCurrentMonth } from "@/lib/utils";

export async function GET() {
  try {
    const today = todayString();
    const currentMonth = getCurrentMonth();

    const last14Days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14Days.push(d.toISOString().slice(0, 10));
    }
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().slice(0, 10));
    }

    const [
      employeeCount,
      presentToday,
      todayProductionAgg,
      activeOrders,
      delayedOrders,
      recentOrdersRaw,
      monthlyPayrollAgg,
      prodMonthRows,
      prod14Rows,
      orderStatusRows,
      att7Rows,
    ] = await Promise.all([
      prisma.employee.count({ where: { isActive: true } }),
      prisma.attendance.count({ where: { date: today, status: "present" } }),
      prisma.dailyProduction.aggregate({
        _sum: { quantity: true },
        where: { date: today },
      }),
      prisma.order.count({
        where: { status: { in: ["new", "in_progress"] } },
      }),
      prisma.order.count({ where: { status: "delayed" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          orderProgress: { select: { produced: true, delivered: true } },
        },
      }),
      prisma.employee.aggregate({
        _sum: { baseSalary: true },
        where: { isActive: true },
      }),
      prisma.dailyProduction.findMany({
        where: { date: { startsWith: currentMonth } },
        select: { employeeId: true, quantity: true },
      }),
      prisma.dailyProduction.findMany({
        where: { date: { in: last14Days } },
        select: { date: true, quantity: true },
      }),
      prisma.order.findMany({ select: { status: true } }),
      prisma.attendance.findMany({
        where: { date: { in: last7Days }, status: "present" },
        select: { date: true },
      }),
    ]);

    const byEmployeeMonth = new Map<string, number>();
    for (const r of prodMonthRows) {
      byEmployeeMonth.set(
        r.employeeId,
        (byEmployeeMonth.get(r.employeeId) ?? 0) + r.quantity
      );
    }
    const topIds = [...byEmployeeMonth.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const employeeIds = topIds.map(([id]) => id);
    const employees =
      employeeIds.length > 0
        ? await prisma.employee.findMany({
            where: { id: { in: employeeIds } },
            select: { id: true, name: true },
          })
        : [];
    const employeeMap = new Map(employees.map((e) => [e.id, e.name]));

    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      description: o.description,
      clientName: o.client.name,
      status: o.status,
      deadline: o.deadline,
      totalQuantity: o.totalQuantity,
      produced: o.orderProgress.reduce((sum, p) => sum + p.produced, 0),
    }));

    const topProducers = topIds.map(([id, total]) => ({
      name: employeeMap.get(id) || "غير معروف",
      total,
    }));

    const prodByDay = new Map<string, number>();
    for (const r of prod14Rows) {
      prodByDay.set(r.date, (prodByDay.get(r.date) ?? 0) + r.quantity);
    }
    const productionTrend = last14Days.map((d) => ({
      date: d,
      quantity: prodByDay.get(d) || 0,
    }));

    const orderStatusLabels: Record<string, string> = {
      new: "جديد",
      in_progress: "جاري",
      delayed: "متأخر",
      completed: "مكتمل",
      delivered: "مسلّم",
    };
    const statusCounts = new Map<string, number>();
    for (const row of orderStatusRows) {
      statusCounts.set(
        row.status,
        (statusCounts.get(row.status) ?? 0) + 1
      );
    }
    const orderDistribution = [...statusCounts.entries()].map(
      ([status, count]) => ({
        status: orderStatusLabels[status] || status,
        count,
      })
    );

    const attByDay = new Map<string, number>();
    for (const r of att7Rows) {
      attByDay.set(r.date, (attByDay.get(r.date) ?? 0) + 1);
    }
    const attendanceTrend = last7Days.map((d) => ({
      date: d,
      present: attByDay.get(d) || 0,
    }));

    return NextResponse.json({
      employeeCount,
      presentToday,
      todayProduction: todayProductionAgg._sum.quantity || 0,
      activeOrders,
      delayedOrders,
      recentOrders,
      topProducers,
      monthlyPayroll: monthlyPayrollAgg._sum.baseSalary || 0,
      productionTrend,
      orderDistribution,
      attendanceTrend,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
