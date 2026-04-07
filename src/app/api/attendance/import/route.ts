import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const records: Array<{
      employeeId: string;
      date: string;
      checkIn?: string;
      checkOut?: string;
      status?: string;
    }> = body;

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "يجب إرسال مصفوفة من السجلات" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(
      records.map((r) =>
        prisma.attendance.upsert({
          where: {
            employeeId_date: { employeeId: r.employeeId, date: r.date },
          },
          update: {
            checkIn: r.checkIn || null,
            checkOut: r.checkOut || null,
            status: r.status || "present",
          },
          create: {
            employeeId: r.employeeId,
            date: r.date,
            checkIn: r.checkIn || null,
            checkOut: r.checkOut || null,
            status: r.status || "present",
          },
        })
      )
    );

    return NextResponse.json(
      { message: `تم استيراد ${results.length} سجل بنجاح`, count: results.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("Attendance import error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في استيراد البيانات" },
      { status: 500 }
    );
  }
}
