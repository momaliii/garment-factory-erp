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

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.minStock !== undefined && { minStock: parseFloat(body.minStock) }),
        ...(body.cost !== undefined && { cost: parseFloat(body.cost) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Inventory PUT error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { id } = await params;
    await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inventory DELETE error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
