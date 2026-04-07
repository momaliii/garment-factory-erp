import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function validateApiKey(request: NextRequest): Promise<{ valid: boolean; keyId?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const rawKey = authHeader.slice(7);
  const hashedKey = crypto.createHash("sha256").update(rawKey).digest("hex");

  const apiKey = await prisma.apiKey.findFirst({
    where: { key: hashedKey, isActive: true },
  });

  if (!apiKey) {
    return { valid: false };
  }

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return { valid: true, keyId: apiKey.id };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "غير مصرح - يرجى تقديم مفتاح API صالح" },
    { status: 401 }
  );
}
