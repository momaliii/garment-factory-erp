import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createBackup,
  listBackups,
  getBackupSettings,
  saveBackupSettings,
  type BackupSettings,
} from "@/lib/backup";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const perms = session.user.permissions as Record<string, unknown>;
    if (!perms.admin)
      return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const backups = listBackups();
    const settings = getBackupSettings();

    return NextResponse.json({ backups, settings });
  } catch (error) {
    console.error("Backups GET error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في جلب النسخ الاحتياطية" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    const perms = session.user.permissions as Record<string, unknown>;
    if (!perms.admin)
      return NextResponse.json({ error: "لا تملك صلاحية" }, { status: 403 });

    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const backup = await createBackup("manual", body.label);
      return NextResponse.json(backup, { status: 201 });
    }

    if (action === "update_settings") {
      const settings: BackupSettings = {
        enabled: body.enabled ?? false,
        schedule: body.schedule ?? "daily",
        time: body.time ?? "02:00",
        dayOfWeek: body.dayOfWeek ?? 6,
        maxBackups: body.maxBackups ?? 30,
        lastBackup: getBackupSettings().lastBackup,
      };
      saveBackupSettings(settings);

      // Reschedule the backup cron
      const { rescheduleBackup } = await import("@/lib/backup-scheduler");
      rescheduleBackup(settings);

      return NextResponse.json({ message: "تم تحديث الإعدادات", settings });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("Backups POST error:", error);
    return NextResponse.json(
      { error: "حدث خطأ في عملية النسخ الاحتياطي" },
      { status: 500 }
    );
  }
}
