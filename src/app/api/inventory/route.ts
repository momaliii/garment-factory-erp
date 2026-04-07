import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const items = await prisma.inventoryItem.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { transactions: true } } },
    });

    const lowStockCount = items.filter((i) => i.isActive && i.quantity <= i.minStock && i.minStock > 0).length;

    return NextResponse.json({ items, lowStockCount });
  } catch (error) {
    console.error("Inventory GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { name, type, quantity, unit, minStock, cost } = body;
    if (!name) return NextResponse.json({ error: "الاسم مطلوب" }, { status: 400 });

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        type: type || "other",
        quantity: parseFloat(quantity) || 0,
        unit: unit || "unit",
        minStock: parseFloat(minStock) || 0,
        cost: parseFloat(cost) || 0,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Inventory POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
