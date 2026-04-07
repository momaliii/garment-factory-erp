import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period");
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (period) where.period = period;
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const records = await prisma.payrollRecord.findMany({
      where,
      include: {
        employee: true,
        deductions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Payroll GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب بيانات المرتبات" },
      { status: 500 }
    );
  }
}

interface AttendanceBonusRules {
  fullAttendanceBonus: number;
  maxAbsenceDays: number;
  lateDeductionPerDay: number;
}

interface ProductionBonusRules {
  targetPerDay: number;
  bonusPerPiece: number;
  minimumDays: number;
}

function calculateAttendanceBonus(
  rules: AttendanceBonusRules,
  absences: number,
  lateDays: number
): number {
  if (absences > rules.maxAbsenceDays) return 0;
  const bonus = rules.fullAttendanceBonus - lateDays * rules.lateDeductionPerDay;
  return Math.max(0, bonus);
}

function calculateProductionBonus(
  rules: ProductionBonusRules,
  totalPieces: number,
  daysWorked: number
): number {
  if (daysWorked < rules.minimumDays) return 0;
  const target = rules.targetPerDay * daysWorked;
  if (totalPieces <= target) return 0;
  return (totalPieces - target) * rules.bonusPerPiece;
}

function getMonthDateRange(period: string): { start: string; end: string } {
  const [year, month] = period.split("-").map(Number);
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

function getWeekDateRange(period: string): { start: string; end: string } {
  const match = period.match(/^(\d{4})-W(\d{2})$/);
  if (!match) throw new Error("Invalid weekly period format");
  const year = parseInt(match[1]);
  const week = parseInt(match[2]);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const start = monday.toISOString().split("T")[0];
  const end = sunday.toISOString().split("T")[0];
  return { start, end };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period, periodType = "monthly" } = body;

    if (!period) {
      return NextResponse.json(
        { error: "الفترة مطلوبة" },
        { status: 400 }
      );
    }

    const { start, end } =
      periodType === "weekly"
        ? getWeekDateRange(period)
        : getMonthDateRange(period);

    const employees = await prisma.employee.findMany({
      where: {
        isActive: true,
        paymentType: periodType,
      },
    });

    const [attendanceSettings, productionSettings] = await Promise.all([
      prisma.bonusSettings.findUnique({ where: { type: "attendance" } }),
      prisma.bonusSettings.findUnique({ where: { type: "production" } }),
    ]);

    const attendanceRules: AttendanceBonusRules | null = attendanceSettings
      ? JSON.parse(attendanceSettings.rules)
      : null;
    const productionRules: ProductionBonusRules | null = productionSettings
      ? JSON.parse(productionSettings.rules)
      : null;

    const results = [];

    for (const employee of employees) {
      const attendance = await prisma.attendance.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: start, lte: end },
        },
      });

      const absences = attendance.filter((a) => a.status === "absent").length;
      const lateDays = attendance.filter((a) => a.status === "late").length;

      const attendanceBonus = attendanceRules
        ? calculateAttendanceBonus(attendanceRules, absences, lateDays)
        : 0;

      const production = await prisma.dailyProduction.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: start, lte: end },
        },
      });

      const totalPieces = production.reduce((sum, p) => sum + p.quantity, 0);
      const daysWorked = attendance.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;

      const productionBonus = productionRules
        ? calculateProductionBonus(productionRules, totalPieces, daysWorked)
        : 0;

      const deductions = await prisma.deduction.findMany({
        where: {
          employeeId: employee.id,
          date: { gte: start, lte: end },
        },
      });

      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);

      const netSalary =
        employee.baseSalary +
        attendanceBonus +
        productionBonus -
        totalDeductions;

      const record = await prisma.payrollRecord.upsert({
        where: {
          employeeId_period: {
            employeeId: employee.id,
            period,
          },
        },
        update: {
          baseSalary: employee.baseSalary,
          attendanceBonus,
          productionBonus,
          totalDeductions,
          netSalary,
          status: "draft",
        },
        create: {
          employeeId: employee.id,
          period,
          periodType,
          baseSalary: employee.baseSalary,
          attendanceBonus,
          productionBonus,
          totalDeductions,
          netSalary,
          status: "draft",
        },
        include: {
          employee: true,
          deductions: true,
        },
      });

      // Link deductions to this payroll record
      if (deductions.length > 0) {
        await prisma.deduction.updateMany({
          where: {
            id: { in: deductions.map((d) => d.id) },
          },
          data: { payrollId: record.id },
        });
      }

      results.push(record);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Payroll POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حساب المرتبات" },
      { status: 500 }
    );
  }
}
