import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const portalToken = await prisma.clientPortalToken.findUnique({
      where: { token },
      include: { client: true },
    });

    if (!portalToken || !portalToken.isActive) {
      return NextResponse.json({ error: "رابط غير صالح" }, { status: 404 });
    }

    if (portalToken.type === "temporary" && portalToken.expiresAt) {
      if (new Date(portalToken.expiresAt) <= new Date()) {
        return NextResponse.json({ error: "الرابط منتهي الصلاحية" }, { status: 410 });
      }
    }

    const orders = await prisma.order.findMany({
      where: { clientId: portalToken.clientId },
      include: {
        orderProgress: { orderBy: { date: "desc" } },
        fabricReceiving: { orderBy: { date: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    const ordersWithStats = orders.map((order) => {
      const totalProduced = order.orderProgress.reduce((sum, p) => sum + p.produced, 0);
      const totalDelivered = order.orderProgress.reduce((sum, p) => sum + p.delivered, 0);
      const remaining = order.totalQuantity - totalDelivered;
      const progressPercent = order.totalQuantity > 0
        ? Math.round((totalProduced / order.totalQuantity) * 100)
        : 0;

      const deadlineDate = new Date(order.deadline);
      const today = new Date();
      const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: order.id,
        type: order.type,
        description: order.description,
        totalQuantity: order.totalQuantity,
        unitPrice: order.unitPrice,
        totalValue: order.totalQuantity * order.unitPrice,
        deadline: order.deadline,
        status: order.status,
        totalProduced,
        totalDelivered,
        remaining,
        progressPercent,
        daysLeft,
        createdAt: order.createdAt,
        progress: order.orderProgress.map((p) => ({
          date: p.date,
          produced: p.produced,
          delivered: p.delivered,
          notes: p.notes,
        })),
        fabricReceiving: order.fabricReceiving.map((f) => ({
          date: f.date,
          fabricType: f.fabricType,
          quantity: f.quantity,
          unit: f.unit,
          notes: f.notes,
        })),
      };
    });

    const totalValue = ordersWithStats.reduce((s, o) => s + o.totalValue, 0);
    const totalDeliveredValue = ordersWithStats
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.totalValue, 0);

    return NextResponse.json({
      client: {
        name: portalToken.client.name,
        phone: portalToken.client.phone,
      },
      orders: ordersWithStats,
      summary: {
        totalOrders: ordersWithStats.length,
        completedOrders: ordersWithStats.filter((o) => o.status === "completed" || o.status === "delivered").length,
        totalQuantity: ordersWithStats.reduce((s, o) => s + o.totalQuantity, 0),
        totalDelivered: ordersWithStats.reduce((s, o) => s + o.totalDelivered, 0),
        totalValue,
        totalDeliveredValue,
        remainingValue: totalValue - totalDeliveredValue,
      },
      tokenType: portalToken.type,
      expiresAt: portalToken.expiresAt,
    });
  } catch (error) {
    console.error("Client portal token GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
