import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const results: Record<string, unknown> = {};
  
  try {
    results.step1_employeeCount = await prisma.employee.count();
  } catch (e) { results.step1_error = String(e); }

  try {
    results.step2_orderCount = await prisma.order.count();
  } catch (e) { results.step2_error = String(e); }

  try {
    results.step3_attendanceCount = await prisma.attendance.count();
  } catch (e) { results.step3_error = String(e); }

  try {
    results.step4_productionCount = await prisma.dailyProduction.count();
  } catch (e) { results.step4_error = String(e); }

  try {
    const today = new Date().toISOString().split("T")[0];
    results.step5_todayProduction = await prisma.dailyProduction.aggregate({
      _sum: { quantity: true },
      where: { date: today },
    });
  } catch (e) { results.step5_error = String(e); }

  try {
    results.step6_groupBy = await prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
  } catch (e) { results.step6_error = String(e); }

  try {
    const month = new Date().toISOString().slice(0, 7);
    results.step7_monthlyProd = await prisma.dailyProduction.groupBy({
      by: ["employeeId"],
      _sum: { quantity: true },
      where: { date: { startsWith: month } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
  } catch (e) { results.step7_error = String(e); }

  return NextResponse.json(results);
}
