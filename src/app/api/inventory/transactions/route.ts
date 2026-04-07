import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    const where = itemId ? { itemId } : {};

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: { item: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("InventoryTransaction GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const body = await request.json();
    const { itemId, type, quantity, orderId, notes } = body;

    if (!itemId || !type || !quantity) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const qty = parseFloat(quantity);

    const transaction = await prisma.inventoryTransaction.create({
      data: { itemId, type, quantity: qty, orderId: orderId || null, notes: notes || null },
    });

    // Update item quantity
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: { quantity: { increment: type === "in" ? qty : -qty } },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error("InventoryTransaction POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
