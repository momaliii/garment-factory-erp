import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const month = searchParams.get("month");

    if (!type) {
      return NextResponse.json(
        { error: "نوع التقرير مطلوب" },
        { status: 400 }
      );
    }

    switch (type) {
      case "production":
        return await getProductionReport(month);
      case "attendance":
        return await getAttendanceReport(month);
      case "payroll":
        return await getPayrollReport(month);
      case "orders":
        return await getOrdersReport(searchParams.get("status"));
      default:
        return NextResponse.json(
          { error: "نوع التقرير غير صحيح" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Reports GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب التقرير" },
      { status: 500 }
    );
  }
}

async function getProductionReport(month: string | null) {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const startDate = `${currentMonth}-01`;
  const endDate = `${currentMonth}-31`;

  const production = await prisma.dailyProduction.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      employee: { select: { id: true, name: true } },
    },
  });

  const employeeMap = new Map<
    string,
    { name: string; totalPieces: number; workDays: Set<string> }
  >();

  for (const record of production) {
    const existing = employeeMap.get(record.employeeId);
    if (existing) {
      existing.totalPieces += record.quantity;
      existing.workDays.add(record.date);
    } else {
      employeeMap.set(record.employeeId, {
        name: record.employee.name,
        totalPieces: record.quantity,
        workDays: new Set([record.date]),
      });
    }
  }

  const employees = Array.from(employeeMap.entries()).map(
    ([id, data]) => ({
      id,
      name: data.name,
      totalPieces: data.totalPieces,
      workDays: data.workDays.size,
      dailyAverage:
        data.workDays.size > 0
          ? Math.round(data.totalPieces / data.workDays.size)
          : 0,
    })
  );

  employees.sort((a, b) => b.totalPieces - a.totalPieces);

  const totalProduction = employees.reduce((s, e) => s + e.totalPieces, 0);
  const topProducer = employees[0]?.totalPieces || 0;
  const overallAverage =
    employees.length > 0
      ? Math.round(totalProduction / employees.length)
      : 0;

  return NextResponse.json({
    stats: {
      totalProduction,
      workerCount: employees.length,
      topProducer,
      dailyAverage: overallAverage,
    },
    employees,
    chartData: employees.slice(0, 10).map((e) => ({
      name: e.name,
      total: e.totalPieces,
    })),
  });
}

async function getAttendanceReport(month: string | null) {
  const currentMonth = month || new Date().toISOString().slice(0, 7);
  const startDate = `${currentMonth}-01`;
  const endDate = `${currentMonth}-31`;

  const attendance = await prisma.attendance.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
    },
    include: {
      employee: { select: { id: true, name: true } },
    },
  });

  const allDates = new Set(attendance.map((a) => a.date));
  const totalWorkDays = allDates.size;

  const employeeMap = new Map<
    string,
    {
      name: string;
      present: number;
      absent: number;
      late: number;
      total: number;
    }
  >();

  for (const record of attendance) {
    const existing = employeeMap.get(record.employeeId);
    if (existing) {
      existing.total++;
      if (record.status === "present") existing.present++;
      else if (record.status === "absent") existing.absent++;
      else if (record.status === "late") existing.late++;
    } else {
      employeeMap.set(record.employeeId, {
        name: record.employee.name,
        present: record.status === "present" ? 1 : 0,
        absent: record.status === "absent" ? 1 : 0,
        late: record.status === "late" ? 1 : 0,
        total: 1,
      });
    }
  }

  const employees = Array.from(employeeMap.entries()).map(
    ([id, data]) => ({
      id,
      name: data.name,
      presentDays: data.present + data.late,
      absentDays: data.absent,
      lateDays: data.late,
      attendanceRate:
        data.total > 0
          ? Math.round(((data.present + data.late) / data.total) * 100)
          : 0,
    })
  );

  const totalAbsence = employees.reduce((s, e) => s + e.absentDays, 0);
  const totalLate = employees.reduce((s, e) => s + e.lateDays, 0);
  const avgAttendance =
    employees.length > 0
      ? Math.round(
          employees.reduce((s, e) => s + e.attendanceRate, 0) /
            employees.length
        )
      : 0;

  return NextResponse.json({
    stats: {
      totalWorkDays,
      avgAttendance,
      totalAbsence,
      totalLate,
    },
    employees,
  });
}

async function getPayrollReport(month: string | null) {
  const currentMonth = month || new Date().toISOString().slice(0, 7);

  const payroll = await prisma.payrollRecord.findMany({
    where: { period: currentMonth },
    include: {
      employee: { select: { id: true, name: true } },
    },
    orderBy: { netSalary: "desc" },
  });

  const totalSalaries = payroll.reduce((s, p) => s + p.netSalary, 0);
  const totalBonus = payroll.reduce(
    (s, p) => s + p.attendanceBonus + p.productionBonus,
    0
  );
  const totalDeductions = payroll.reduce(
    (s, p) => s + p.totalDeductions,
    0
  );

  const employees = payroll.map((p) => ({
    id: p.id,
    name: p.employee.name,
    baseSalary: p.baseSalary,
    attendanceBonus: p.attendanceBonus,
    productionBonus: p.productionBonus,
    deductions: p.totalDeductions,
    netSalary: p.netSalary,
  }));

  return NextResponse.json({
    stats: {
      totalSalaries,
      totalBonus,
      totalDeductions,
      employeeCount: payroll.length,
    },
    employees,
  });
}

async function getOrdersReport(status: string | null) {
  const where = status && status !== "all" ? { status } : {};

  const orders = await prisma.order.findMany({
    where,
    include: {
      client: { select: { name: true } },
      orderProgress: {
        select: { produced: true, delivered: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const result = orders.map((order) => {
    const totalProduced = order.orderProgress.reduce(
      (sum: number, p: { produced: number }) => sum + p.produced,
      0
    );
    const totalDelivered = order.orderProgress.reduce(
      (sum: number, p: { delivered: number }) => sum + p.delivered,
      0
    );
    const remaining = order.totalQuantity - totalProduced;

    return {
      id: order.id,
      clientName: order.client.name,
      description: order.description || "بدون وصف",
      totalQuantity: order.totalQuantity,
      totalProduced,
      totalDelivered,
      remaining: Math.max(0, remaining),
      deadline: order.deadline,
      status: order.status,
    };
  });

  const totalOrders = result.length;
  const activeOrders = result.filter(
    (o) => o.status === "in_progress" || o.status === "new"
  ).length;
  const completedOrders = result.filter(
    (o) => o.status === "completed" || o.status === "delivered"
  ).length;
  const delayedOrders = result.filter(
    (o) => o.status === "delayed"
  ).length;

  return NextResponse.json({
    stats: {
      totalOrders,
      activeOrders,
      completedOrders,
      delayedOrders,
    },
    orders: result,
  });
}
