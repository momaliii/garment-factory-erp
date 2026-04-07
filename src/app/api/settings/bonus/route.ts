import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.bonusSettings.findMany();

    const result: Record<string, unknown> = {};
    for (const s of settings) {
      result[s.type] = JSON.parse(s.rules);
    }

    if (!result.attendance) {
      result.attendance = {
        fullAttendanceBonus: 200,
        maxAbsenceDays: 2,
        lateDeductionPerDay: 50,
      };
    }
    if (!result.production) {
      result.production = {
        targetPerDay: 50,
        bonusPerPiece: 2,
        minimumDays: 20,
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("BonusSettings GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب إعدادات البونص" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, rules } = body;

    if (!type || !rules) {
      return NextResponse.json(
        { error: "النوع والقواعد مطلوبين" },
        { status: 400 }
      );
    }

    if (type !== "attendance" && type !== "production") {
      return NextResponse.json(
        { error: "نوع البونص غير صحيح" },
        { status: 400 }
      );
    }

    const setting = await prisma.bonusSettings.upsert({
      where: { type },
      update: { rules: JSON.stringify(rules) },
      create: { type, rules: JSON.stringify(rules) },
    });

    return NextResponse.json({
      type: setting.type,
      rules: JSON.parse(setting.rules),
    });
  } catch (error) {
    console.error("BonusSettings PUT error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحديث إعدادات البونص" },
      { status: 500 }
    );
  }
}
