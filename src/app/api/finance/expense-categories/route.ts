import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const categories = await prisma.expenseCategory.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { expenses: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("ExpenseCategory GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { name, type } = await request.json();
    if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });

    const category = await prisma.expenseCategory.create({
      data: { name, type: type || "variable" },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("ExpenseCategory POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
