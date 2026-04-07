import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const machine = await prisma.machine.findUnique({
      where: { id },
      include: { employees: true },
    });

    if (!machine) {
      return NextResponse.json({ error: "المعدة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Machine GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, type, status } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "الاسم والنوع مطلوبين" },
        { status: 400 }
      );
    }

    const machine = await prisma.machine.update({
      where: { id },
      data: {
        name,
        type,
        status: status || "active",
      },
      include: { employees: true },
    });

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Machine PUT error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تعديل المعدة" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.machine.delete({
      where: { id },
    });

    return NextResponse.json({ message: "تم حذف المعدة" });
  } catch (error) {
    console.error("Machine DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف المعدة" },
      { status: 500 }
    );
  }
}
