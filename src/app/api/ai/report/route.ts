import { NextRequest, NextResponse } from "next/server";
import { generateSmartReport } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح OpenAI غير مضبوط. يرجى إضافة OPENAI_API_KEY في ملف .env" },
        { status: 500 }
      );
    }

    const { type } = await request.json();
    const reportType = type || "general";

    const report = await generateSmartReport(reportType);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("AI Report error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء التقرير الذكي" },
      { status: 500 }
    );
  }
}
