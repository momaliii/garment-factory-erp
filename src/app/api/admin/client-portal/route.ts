import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const tokens = await prisma.clientPortalToken.findMany({
      include: { client: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tokens);
  } catch (error) {
    console.error("Client portal GET error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, type, expiresAt } = body;

    if (!clientId) {
      return NextResponse.json({ error: "يجب تحديد العميل" }, { status: 400 });
    }

    const token = crypto.randomUUID();

    const portalToken = await prisma.clientPortalToken.create({
      data: {
        token,
        clientId,
        type: type || "permanent",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: { client: true },
    });

    return NextResponse.json(portalToken, { status: 201 });
  } catch (error) {
    console.error("Client portal POST error:", error);
    return NextResponse.json({ error: "حدث خطأ" }, { status: 500 });
  }
}
