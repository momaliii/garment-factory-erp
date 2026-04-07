import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function GET() {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      include: {
        logs: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = endpoints.map((ep) => ({
      ...ep,
      events: JSON.parse(ep.events),
      logs: ep.logs.map((log) => ({
        ...log,
        payload: JSON.parse(log.payload),
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Webhooks GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب الويب هوكس" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, events } = body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "الرابط والأحداث مطلوبين" },
        { status: 400 }
      );
    }

    const secret = randomBytes(32).toString("hex");

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        url,
        events: JSON.stringify(events),
        secret,
      },
    });

    return NextResponse.json(
      {
        ...endpoint,
        events: JSON.parse(endpoint.events),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Webhooks POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إضافة الويب هوك" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "معرف الويب هوك مطلوب" },
        { status: 400 }
      );
    }

    await prisma.webhookLog.deleteMany({ where: { endpointId: id } });
    await prisma.webhookEndpoint.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhooks DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف الويب هوك" },
      { status: 500 }
    );
  }
}
