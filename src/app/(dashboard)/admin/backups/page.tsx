"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HardDrive,
  Download,
  RotateCcw,
  Trash2,
  Plus,
  Clock,
  Save,
  AlertTriangle,
  CheckCircle2,
  Database,
  Calendar,
  Loader2,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
  type: "manual" | "auto";
  label?: string;
}

interface BackupSettings {
  enabled: boolean;
  schedule: "daily" | "weekly";
  time: string;
  dayOfWeek?: number;
  maxBackups: number;
  lastBackup?: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DAYS = [
  { value: 0, label: "الأحد" },
  { value: 1, label: "الإثنين" },
  { value: 2, label: "الثلاثاء" },
  { value: 3, label: "الأربعاء" },
  { value: 4, label: "الخميس" },
  { value: 5, label: "الجمعة" },
  { value: 6, label: "السبت" },
];

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [settings, setSettings] = useState<BackupSettings>({
    enabled: false,
    schedule: "daily",
    time: "02:00",
    dayOfWeek: 6,
    maxBackups: 30,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState<BackupInfo | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<BackupInfo | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/backups", { credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBackups(data.backups);
      setSettings(data.settings);
    } catch {
      toast.error("فشل في جلب النسخ الاحتياطية");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "create" }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم إنشاء نسخة احتياطية بنجاح");
      fetchData();
    } catch {
      toast.error("فشل في إنشاء النسخة الاحتياطية");
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "update_settings", ...settings }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ إعدادات الجدولة");
    } catch {
      toast.error("فشل في حفظ الإعدادات");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleDownload(filename: string) {
    try {
      const res = await fetch(`/api/admin/backups/${filename}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("جاري تحميل النسخة الاحتياطية");
    } catch {
      toast.error("فشل في تحميل النسخة");
    }
  }

  async function handleRestore() {
    if (!restoreDialog) return;
    setRestoring(true);
    try {
      const res = await fetch(
        `/api/admin/backups/${restoreDialog.filename}`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("تم استعادة النسخة بنجاح. يرجى إعادة تحميل الصفحة.");
      setRestoreDialog(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "فشل في استعادة النسخة"
      );
    } finally {
      setRestoring(false);
    }
  }

  async function handleDelete() {
    if (!deleteDialog) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/backups/${deleteDialog.filename}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error();
      toast.success("تم حذف النسخة الاحتياطية");
      setDeleteDialog(null);
      fetchData();
    } catch {
      toast.error("فشل في حذف النسخة");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  const autoBackups = backups.filter((b) => b.type === "auto");
  const manualBackups = backups.filter((b) => b.type === "manual");
  const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="النسخ الاحتياطي واستعادة البيانات"
        description="نسخ JSON من النظام + جدولة تلقائية؛ ويُنصح بنسخ SQL من phpMyAdmin كطبقة إضافية"
        action={{
          label: creating ? "جاري الإنشاء..." : "نسخة احتياطية الآن",
          icon: Plus,
          onClick: handleCreate,
        }}
      />

      <Card className="border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Server className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            نسخ احتياطي من phpMyAdmin (موصى به مع النسخ داخل النظام)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            نسخ النظام (JSON) مفيدة للاستعادة من داخل التطبيق. نسخة{" "}
            <strong className="text-foreground">SQL كاملة</strong> من phpMyAdmin تحمي
            قاعدة البيانات حتى لو تعطل التطبيق أو تغيّر السيرفر — استخدم الاثنين معًا.
          </p>
          <p className="font-medium text-foreground">جدولة مقترحة يدويًا من لوحة الاستضافة</p>
          <ul className="list-disc list-inside space-y-1 pe-2">
            <li>
              <strong className="text-foreground">أسبوعيًا</strong> (مثلاً كل أحد): تصدير SQL من phpMyAdmin.
            </li>
            <li>
              <strong className="text-foreground">يوميًا</strong>: فعّل الجدولة أدناه للنسخ JSON التلقائية داخل النظام.
            </li>
          </ul>
          <p className="font-medium text-foreground">خطوات التصدير على Hostinger (وما شابهها)</p>
          <ol className="list-decimal list-inside space-y-1 pe-2">
            <li>ادخل إلى hPanel → قواعد البيانات → افتح phpMyAdmin.</li>
            <li>اختر قاعدة بيانات المشروع من القائمة اليسرى.</li>
            <li>تبويب Export — طريقة Quick — تنسيق SQL — تنزيل الملف (Go).</li>
            <li>احفظ الملف في مكان آمن (جهازك أو تخزين سحابي).</li>
          </ol>
          <p className="text-xs border-t border-border/60 pt-3">
            لا يمكن للتطبيق تشغيل phpMyAdmin تلقائيًا؛ التصدير SQL يتم من لوحة الاستضافة.
            إن وفر المستضيف «نسخ احتياطي مجدول» لقاعدة MySQL، فعّله أيضًا كطبقة ثالثة.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">إجمالي النسخ</p>
              <p className="text-xl font-bold">{backups.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <HardDrive className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الحجم الإجمالي</p>
              <p className="text-xl font-bold">{formatSize(totalSize)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">آخر نسخة</p>
              <p className="text-sm font-medium">
                {settings.lastBackup
                  ? formatDate(settings.lastBackup)
                  : "لم يتم بعد"}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                settings.enabled
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              <Clock
                className={`h-5 w-5 ${
                  settings.enabled
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-400"
                }`}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">الجدولة التلقائية</p>
              <p className="text-sm font-medium">
                {settings.enabled ? (
                  <span className="text-green-600">مفعّلة</span>
                ) : (
                  <span className="text-muted-foreground">معطّلة</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Settings */}
      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          إعدادات الجدولة التلقائية
        </h2>

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label className="min-w-[100px]">تفعيل الجدولة</Label>
            <button
              type="button"
              onClick={() =>
                setSettings({ ...settings, enabled: !settings.enabled })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                settings.enabled ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform ${
                  settings.enabled ? "-translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {settings.enabled && (
            <>
              <div className="flex items-center gap-4">
                <Label className="min-w-[100px]">التكرار</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setSettings({ ...settings, schedule: "daily" })
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.schedule === "daily"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    يومي
                  </button>
                  <button
                    onClick={() =>
                      setSettings({ ...settings, schedule: "weekly" })
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.schedule === "weekly"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    أسبوعي
                  </button>
                </div>
              </div>

              {settings.schedule === "weekly" && (
                <div className="flex items-center gap-4">
                  <Label className="min-w-[100px]">يوم الأسبوع</Label>
                  <select
                    value={settings.dayOfWeek ?? 6}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dayOfWeek: parseInt(e.target.value),
                      })
                    }
                    className="rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    {DAYS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-4">
                <Label className="min-w-[100px]">الوقت</Label>
                <Input
                  type="time"
                  value={settings.time}
                  onChange={(e) =>
                    setSettings({ ...settings, time: e.target.value })
                  }
                  className="w-40"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center gap-4">
                <Label className="min-w-[100px]">أقصى عدد نسخ</Label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={settings.maxBackups}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      maxBackups: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-24"
                  dir="ltr"
                />
                <span className="text-sm text-muted-foreground">
                  الأقدم يُحذف تلقائياً
                </span>
              </div>
            </>
          )}

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              <Save className="h-4 w-4 ml-2" />
              {savingSettings ? "جاري الحفظ..." : "حفظ الإعدادات"}
            </Button>
          </div>
        </div>
      </div>

      {/* Backup List */}
      <div className="rounded-xl border bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            النسخ الاحتياطية ({backups.length})
          </h2>
          {backups.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {autoBackups.length} تلقائي · {manualBackups.length} يدوي
            </p>
          )}
        </div>

        {backups.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground">
              لا توجد نسخ احتياطية
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              أنشئ أول نسخة احتياطية للحفاظ على بياناتك
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      backup.type === "auto"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-amber-100 dark:bg-amber-900/30"
                    }`}
                  >
                    <Database
                      className={`h-4 w-4 ${
                        backup.type === "auto"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-600 dark:text-amber-400"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium font-mono" dir="ltr">
                        {backup.filename}
                      </p>
                      <Badge
                        variant={
                          backup.type === "auto" ? "secondary" : "outline"
                        }
                      >
                        {backup.type === "auto" ? "تلقائي" : "يدوي"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(backup.createdAt)} · {formatSize(backup.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(backup.filename)}
                    title="تحميل"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRestoreDialog(backup)}
                    title="استعادة"
                  >
                    <RotateCcw className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteDialog(backup)}
                    title="حذف"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restore Confirmation */}
      <Dialog
        open={!!restoreDialog}
        onOpenChange={() => setRestoreDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              تأكيد استعادة النسخة
            </DialogTitle>
            <DialogDescription>
              سيتم استبدال قاعدة البيانات الحالية بالنسخة المحددة. سيتم إنشاء
              نسخة احتياطية من الوضع الحالي قبل الاستعادة.
            </DialogDescription>
          </DialogHeader>
          {restoreDialog && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-mono" dir="ltr">
                {restoreDialog.filename}
              </p>
              <p className="text-muted-foreground mt-1">
                {formatDate(restoreDialog.createdAt)} ·{" "}
                {formatSize(restoreDialog.size)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialog(null)}
            >
              إلغاء
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              <CheckCircle2 className="h-4 w-4 ml-2" />
              {restoring ? "جاري الاستعادة..." : "استعادة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ لا يمكن التراجع عن
              هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog(null)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
