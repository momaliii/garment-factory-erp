import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const machines = await prisma.machine.findMany({
      include: { employees: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(machines);
  } catch (error) {
    console.error("Machines GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب المعدات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, status } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "الاسم والنوع مطلوبين" },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.create({
      data: {
        name,
        type,
        status: status || "active",
      },
      include: { employees: true },
    });

    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    console.error("Machines POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة المعدة" },
      { status: 500 }
    );
  }
}
