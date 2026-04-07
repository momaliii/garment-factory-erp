import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ results: [] });

    const [employees, clients, orders, machines] = await Promise.all([
      prisma.employee.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, role: true },
        take: 5,
      }),
      prisma.client.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.order.findMany({
        where: { OR: [{ description: { contains: q } }] },
        select: { id: true, description: true, status: true },
        take: 5,
      }),
      prisma.machine.findMany({
        where: { name: { contains: q } },
        select: { id: true, name: true, type: true },
        take: 5,
      }),
    ]);

    const results = [
      ...employees.map((e) => ({ type: "employee", id: e.id, title: e.name, subtitle: e.role, href: "/employees" })),
      ...clients.map((c) => ({ type: "client", id: c.id, title: c.name, subtitle: "عميل", href: "/clients" })),
      ...orders.map((o) => ({ type: "order", id: o.id, title: o.description || "أوردر", subtitle: o.status, href: "/orders" })),
      ...machines.map((m) => ({ type: "machine", id: m.id, title: m.name, subtitle: m.type, href: "/machines" })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
