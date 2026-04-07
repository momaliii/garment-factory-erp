import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "monthly";
    const month = searchParams.get("month");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const months = parseInt(searchParams.get("months") || "6");

    if (type === "monthly") {
      const targetMonth = month || new Date().toISOString().slice(0, 7);
      const startDate = `${targetMonth}-01`;
      const endDate = `${targetMonth}-31`;

      const [expenses, revenues] = await Promise.all([
        prisma.expense.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          include: { category: true },
        }),
        prisma.revenue.findMany({
          where: { date: { gte: startDate, lte: endDate } },
          include: { category: true },
        }),
      ]);

      const expensesByCategory: Record<string, { name: string; total: number }> = {};
      expenses.forEach((e) => {
        if (!expensesByCategory[e.categoryId]) {
          expensesByCategory[e.categoryId] = { name: e.category.name, total: 0 };
        }
        expensesByCategory[e.categoryId].total += e.amount;
      });

      const revenuesByCategory: Record<string, { name: string; total: number }> = {};
      revenues.forEach((r) => {
        if (!revenuesByCategory[r.categoryId]) {
          revenuesByCategory[r.categoryId] = { name: r.category.name, total: 0 };
        }
        revenuesByCategory[r.categoryId].total += r.amount;
      });

      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0);

      return NextResponse.json({
        month: targetMonth,
        expensesByCategory: Object.values(expensesByCategory),
        revenuesByCategory: Object.values(revenuesByCategory),
        totalExpenses,
        totalRevenues,
        netProfit: totalRevenues - totalExpenses,
      });
    }

    if (type === "profit-loss") {
      const fromDate = from || "2020-01-01";
      const toDate = to || "2099-12-31";

      const [expenses, revenues] = await Promise.all([
        prisma.expense.findMany({ where: { date: { gte: fromDate, lte: toDate } }, include: { category: true } }),
        prisma.revenue.findMany({ where: { date: { gte: fromDate, lte: toDate } }, include: { category: true } }),
      ]);

      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const totalRevenues = revenues.reduce((s, r) => s + r.amount, 0);

      const expDetail: Record<string, number> = {};
      expenses.forEach((e) => { expDetail[e.category.name] = (expDetail[e.category.name] || 0) + e.amount; });
      const revDetail: Record<string, number> = {};
      revenues.forEach((r) => { revDetail[r.category.name] = (revDetail[r.category.name] || 0) + r.amount; });

      return NextResponse.json({
        from: fromDate,
        to: toDate,
        totalExpenses,
        totalRevenues,
        netProfit: totalRevenues - totalExpenses,
        expenseDetails: Object.entries(expDetail).map(([name, total]) => ({ name, total })),
        revenueDetails: Object.entries(revDetail).map(([name, total]) => ({ name, total })),
      });
    }

    if (type === "comparison") {
      const now = new Date();
      const data = [];

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const startDate = `${m}-01`;
        const endDate = `${m}-31`;

        const [expenses, revenues] = await Promise.all([
          prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: startDate, lte: endDate } } }),
          prisma.revenue.aggregate({ _sum: { amount: true }, where: { date: { gte: startDate, lte: endDate } } }),
        ]);

        data.push({
          month: m,
          expenses: expenses._sum.amount || 0,
          revenues: revenues._sum.amount || 0,
          profit: (revenues._sum.amount || 0) - (expenses._sum.amount || 0),
        });
      }

      return NextResponse.json({ months: data });
    }

    if (type === "statement") {
      const fromDate = from || "2020-01-01";
      const toDate = to || "2099-12-31";

      const [expenses, revenues] = await Promise.all([
        prisma.expense.findMany({
          where: { date: { gte: fromDate, lte: toDate } },
          include: { category: true },
          orderBy: { date: "asc" },
        }),
        prisma.revenue.findMany({
          where: { date: { gte: fromDate, lte: toDate } },
          include: { category: true },
          orderBy: { date: "asc" },
        }),
      ]);

      const entries = [
        ...expenses.map((e) => ({ type: "expense" as const, date: e.date, amount: e.amount, category: e.category.name, description: e.description })),
        ...revenues.map((r) => ({ type: "revenue" as const, date: r.date, amount: r.amount, category: r.category.name, description: r.description })),
      ].sort((a, b) => a.date.localeCompare(b.date));

      let balance = 0;
      const statement = entries.map((e) => {
        balance += e.type === "revenue" ? e.amount : -e.amount;
        return { ...e, balance };
      });

      return NextResponse.json({ from: fromDate, to: toDate, statement });
    }

    return NextResponse.json({ error: "نوع التقرير غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Finance reports error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
