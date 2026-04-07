import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    const where = orderId ? { orderId } : {};

    const stages = await prisma.productionStage.findMany({
      where,
      include: { order: { select: { id: true, description: true, client: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error("ProductionStages GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

const STAGES = ["cutting", "sewing", "finishing", "ironing", "quality", "packing"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) return NextResponse.json({ error: "يجب تحديد الأوردر" }, { status: 400 });

    const existing = await prisma.productionStage.findMany({ where: { orderId } });
    if (existing.length > 0) {
      return NextResponse.json({ error: "المراحل موجودة بالفعل" }, { status: 400 });
    }

    const created = await prisma.productionStage.createMany({
      data: STAGES.map((stage) => ({ orderId, stage, status: "pending" })),
    });

    return NextResponse.json({ created: created.count }, { status: 201 });
  } catch (error) {
    console.error("ProductionStages POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
