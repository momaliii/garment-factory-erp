import { NextRequest, NextResponse } from "next/server";
import { chatWithAI } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "مفتاح OpenAI غير مضبوط. يرجى إضافة OPENAI_API_KEY في ملف .env" },
        { status: 500 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "يرجى إرسال رسالة" },
        { status: 400 }
      );
    }

    const reply = await chatWithAI(messages);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("AI Chat error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في المساعد الذكي. تأكد من صلاحية مفتاح API." },
      { status: 500 }
    );
  }
}
