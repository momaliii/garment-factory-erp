import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");

    const where: Record<string, unknown> = {};

    if (date) {
      where.date = date;
    } else if (month) {
      where.date = { startsWith: month };
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: { employee: true },
      orderBy: [{ date: "desc" }, { employee: { name: "asc" } }],
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error("Attendance GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب سجلات الحضور" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date, checkIn, checkOut, status, notes } = body;

    if (!employeeId || !date) {
      return NextResponse.json(
        { error: "رقم الموظف والتاريخ مطلوبين" },
        { status: 400 }
      );
    }

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: { employeeId, date },
      },
      update: {
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: status || "present",
        notes: notes || null,
      },
      create: {
        employeeId,
        date,
        checkIn: checkIn || null,
        checkOut: checkOut || null,
        status: status || "present",
        notes: notes || null,
      },
      include: { employee: true },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تسجيل الحضور" },
      { status: 500 }
    );
  }
}
