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

    const revenues = await prisma.revenue.findMany({
      where,
      include: { category: true, order: { select: { id: true, description: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(revenues);
  } catch (error) {
    console.error("Revenues GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { categoryId, amount, description, date, orderId } = body;

    if (!categoryId || !amount || !date) {
      return NextResponse.json({ error: "البند والمبلغ والتاريخ مطلوبين" }, { status: 400 });
    }

    const revenue = await prisma.revenue.create({
      data: {
        categoryId,
        amount: parseFloat(amount),
        description: description || null,
        date,
        orderId: orderId || null,
        createdById: (session.user as { userId: string }).userId,
      },
      include: { category: true },
    });

    return NextResponse.json(revenue, { status: 201 });
  } catch (error) {
    console.error("Revenues POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
