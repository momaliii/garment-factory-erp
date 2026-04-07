import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { todayString, getCurrentMonth } from "@/lib/utils";

export async function GET() {
  try {
    const today = todayString();
    const currentMonth = getCurrentMonth();

    const [
      employeeCount,
      presentToday,
      todayProductionAgg,
      activeOrders,
      delayedOrders,
      recentOrdersRaw,
      topProducersRaw,
      monthlyPayrollAgg,
    ] = await Promise.all([
      prisma.employee.count({ where: { isActive: true } }),
      prisma.attendance.count({ where: { date: today, status: "present" } }),
      prisma.dailyProduction.aggregate({ _sum: { quantity: true }, where: { date: today } }),
      prisma.order.count({ where: { status: { in: ["new", "in_progress"] } } }),
      prisma.order.count({ where: { status: "delayed" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          client: { select: { name: true } },
          orderProgress: { select: { produced: true, delivered: true } },
        },
      }),
      prisma.dailyProduction.groupBy({
        by: ["employeeId"],
        _sum: { quantity: true },
        where: { date: { startsWith: currentMonth } },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.employee.aggregate({ _sum: { baseSalary: true }, where: { isActive: true } }),
    ]);

    const employeeIds = topProducersRaw.map((p) => p.employeeId);
    const employees = await prisma.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true },
    });
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

    const topProducers = topProducersRaw.map((p) => ({
      name: employeeMap.get(p.employeeId) || "غير معروف",
      total: p._sum.quantity || 0,
    }));

    // Production trend - last 14 days
    const last14Days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last14Days.push(d.toISOString().slice(0, 10));
    }
    const prodByDay = await prisma.dailyProduction.groupBy({
      by: ["date"],
      _sum: { quantity: true },
      where: { date: { in: last14Days } },
    });
    const prodMap = new Map(prodByDay.map((p) => [p.date, p._sum.quantity || 0]));
    const productionTrend = last14Days.map((d) => ({ date: d, quantity: prodMap.get(d) || 0 }));

    // Order status distribution
    const allOrders = await prisma.order.groupBy({ by: ["status"], _count: true });
    const orderStatusLabels: Record<string, string> = { new: "جديد", in_progress: "جاري", delayed: "متأخر", completed: "مكتمل", delivered: "مسلّم" };
    const orderDistribution = allOrders.map((o) => ({ status: orderStatusLabels[o.status] || o.status, count: o._count }));

    // Attendance trend - last 7 days
    const last7Days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().slice(0, 10));
    }
    const attByDay = await prisma.attendance.groupBy({
      by: ["date"],
      _count: true,
      where: { date: { in: last7Days }, status: "present" },
    });
    const attMap = new Map(attByDay.map((a) => [a.date, a._count]));
    const attendanceTrend = last7Days.map((d) => ({ date: d, present: attMap.get(d) || 0 }));

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
