import cron, { type ScheduledTask } from "node-cron";
import { createBackup, getBackupSettings, type BackupSettings } from "./backup";

let currentTask: ScheduledTask | null = null;

function buildCronExpression(settings: BackupSettings): string {
  const [hour, minute] = settings.time.split(":").map(Number);

  if (settings.schedule === "weekly") {
    const day = settings.dayOfWeek ?? 6;
    return `${minute} ${hour} * * ${day}`;
  }

  // daily
  return `${minute} ${hour} * * *`;
}

export function rescheduleBackup(settings: BackupSettings) {
  if (currentTask) {
    currentTask.stop();
    currentTask = null;
  }

  if (!settings.enabled) {
    console.log("[Backup] الجدولة التلقائية معطلة");
    return;
  }

  const expression = buildCronExpression(settings);

  currentTask = cron.schedule(expression, async () => {
    try {
      const backup = await createBackup("auto");
      console.log(`[Backup] نسخة احتياطية تلقائية: ${backup.filename}`);
    } catch (err) {
      console.error("[Backup] فشل النسخ الاحتياطي التلقائي:", err);
    }
  });

  const scheduleLabel =
    settings.schedule === "daily"
      ? `يومياً الساعة ${settings.time}`
      : `أسبوعياً يوم ${getDayName(settings.dayOfWeek ?? 6)} الساعة ${settings.time}`;

  console.log(`[Backup] تم جدولة النسخ الاحتياطي: ${scheduleLabel}`);
}

function getDayName(day: number): string {
  const days = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];
  return days[day] || "غير معروف";
}

export function initBackupScheduler() {
  const settings = getBackupSettings();
  rescheduleBackup(settings);
}
