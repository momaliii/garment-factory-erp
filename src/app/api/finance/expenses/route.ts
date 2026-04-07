import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const categoryId = searchParams.get("categoryId");

    const where: Record<string, unknown> = {};
    if (from && to) where.date = { gte: from, lte: to };
    else if (from) where.date = { gte: from };
    else if (to) where.date = { lte: to };
    if (categoryId) where.categoryId = categoryId;

    const expenses = await prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("Expenses GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { categoryId, amount, description, date, isRecurring } = body;

    if (!categoryId || !amount || !date) {
      return NextResponse.json({ error: "البند والمبلغ والتاريخ مطلوبين" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        categoryId,
        amount: parseFloat(amount),
        description: description || null,
        date,
        isRecurring: isRecurring || false,
        createdById: (session.user as { userId: string }).userId,
      },
      include: { category: true },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expenses POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
