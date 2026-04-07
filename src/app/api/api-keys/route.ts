import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";

function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function maskKey(hashedKey: string): string {
  return "••••••••" + hashedKey.slice(-4);
}

export async function GET() {
  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
    });

    const result = keys.map((k: typeof keys[number]) => ({
      id: k.id,
      name: k.name,
      key: maskKey(k.key),
      permissions: JSON.parse(k.permissions),
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      createdAt: k.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("ApiKeys GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب مفاتيح API" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permissions } = body;

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "الاسم والصلاحيات مطلوبين" },
        { status: 400 }
      );
    }

    const rawKey = `gf_${randomBytes(32).toString("hex")}`;
    const hashed = hashKey(rawKey);

    const apiKey = await prisma.apiKey.create({
      data: {
        name,
        key: hashed,
        permissions: JSON.stringify(permissions),
      },
    });

    return NextResponse.json(
      {
        id: apiKey.id,
        name: apiKey.name,
        key: rawKey,
        permissions: JSON.parse(apiKey.permissions),
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ApiKeys POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في إنشاء مفتاح API" },
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
        { error: "معرف المفتاح مطلوب" },
        { status: 400 }
      );
    }

    await prisma.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ApiKeys DELETE error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في حذف مفتاح API" },
      { status: 500 }
    );
  }
}
