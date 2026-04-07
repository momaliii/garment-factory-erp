import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === "in_progress" && !body.startedAt) updateData.startedAt = new Date();
      if (body.status === "completed" && !body.completedAt) updateData.completedAt = new Date();
    }
    if (body.assigneeId !== undefined) updateData.assigneeId = body.assigneeId || null;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await prisma.productionStage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("ProductionStage PUT error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
