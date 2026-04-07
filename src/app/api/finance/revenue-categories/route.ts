import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const categories = await prisma.revenueCategory.findMany({
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { revenues: true } } },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("RevenueCategory GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { name } = await request.json();
    if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });

    const category = await prisma.revenueCategory.create({ data: { name } });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("RevenueCategory POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
