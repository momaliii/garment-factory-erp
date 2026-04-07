import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  restoreBackup,
  deleteBackup,
  getBackupPath,
} from "@/lib/backup";
import fs from "fs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const perms = session.user.permissions as Record<string, unknown>;
    if (!perms.admin)
      return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const { filename } = await params;
    const filePath = getBackupPath(filename);

    if (!filePath) {
      return NextResponse.json(
        { error: "ملف النسخة الاحتياطية غير موجود" },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup download error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في تحميل النسخة" },
      { status: 500 }
    );
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const perms = session.user.permissions as Record<string, unknown>;
    if (!perms.admin)
      return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const { filename } = await params;
    await restoreBackup(filename);

    return NextResponse.json({
      message: "تم استعادة النسخة الاحتياطية بنجاح. يرجى إعادة تشغيل التطبيق.",
    });
  } catch (error) {
    console.error("Backup restore error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ في استعادة النسخة",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const perms = session.user.permissions as Record<string, unknown>;
    if (!perms.admin)
      return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const { filename } = await params;
    deleteBackup(filename);

    return NextResponse.json({ message: "تم حذف النسخة الاحتياطية" });
  } catch (error) {
    console.error("Backup delete error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ في حذف النسخة",
      },
      { status: 500 }
    );
  }
}
