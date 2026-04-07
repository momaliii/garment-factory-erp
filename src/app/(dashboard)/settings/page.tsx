"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings,
  Webhook,
  Key,
  Save,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Globe,
  Shield,
  Clock,
  Database,
  Download,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttendanceBonusSettings {
  fullAttendanceBonus: number;
  maxAbsenceDays: number;
  lateDeductionPerDay: number;
}

interface ProductionBonusSettings {
  targetPerDay: number;
  bonusPerPiece: number;
  minimumDays: number;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: string;
  logs: Array<{
    id: string;
    event: string;
    payload: Record<string, unknown>;
    statusCode: number | null;
    createdAt: string;
  }>;
}

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

const WEBHOOK_EVENTS = [
  { value: "order.created", label: "إنشاء أوردر" },
  { value: "order.completed", label: "اكتمال أوردر" },
  { value: "order.overdue", label: "تأخر أوردر" },
  { value: "employee.absent", label: "غياب موظف" },
  { value: "production.recorded", label: "تسجيل إنتاج" },
  { value: "payroll.calculated", label: "حساب مرتب" },
  { value: "attendance.late", label: "تأخر موظف" },
];

const API_PERMISSIONS = [
  { value: "employees.read", label: "قراءة الموظفين" },
  { value: "employees.write", label: "تعديل الموظفين" },
  { value: "orders.read", label: "قراءة الأوردرات" },
  { value: "orders.write", label: "تعديل الأوردرات" },
  { value: "production.read", label: "قراءة الإنتاج" },
  { value: "production.write", label: "تسجيل الإنتاج" },
  { value: "attendance.read", label: "قراءة الحضور" },
  { value: "attendance.write", label: "تسجيل الحضور" },
  { value: "payroll.read", label: "قراءة المرتبات" },
  { value: "reports.read", label: "قراءة التقارير" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("bonus");

  return (
    <div className="space-y-6">
      <PageHeader title="الإعدادات" description="إدارة إعدادات النظام" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="bonus" className="gap-2">
            <Settings className="h-4 w-4" />
            البونص
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            البيانات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bonus">
          <BonusSettingsTab />
        </TabsContent>
        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>
        <TabsContent value="data">
          <DataManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BonusSettingsTab() {
  const [loading, setLoading] = useState(true);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [savingProduction, setSavingProduction] = useState(false);
  const [attendance, setAttendance] = useState<AttendanceBonusSettings>({
    fullAttendanceBonus: 200,
    maxAbsenceDays: 2,
    lateDeductionPerDay: 50,
  });
  const [production, setProduction] = useState<ProductionBonusSettings>({
    targetPerDay: 50,
    bonusPerPiece: 2,
    minimumDays: 20,
  });

  useEffect(() => {
    fetch("/api/settings/bonus")
      .then((r) => r.json())
      .then((data) => {
        if (data.attendance) setAttendance(data.attendance);
        if (data.production) setProduction(data.production);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const saveAttendance = async () => {
    setSavingAttendance(true);
    try {
      const res = await fetch("/api/settings/bonus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "attendance", rules: attendance }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ إعدادات بونص الانتظام");
    } catch {
      toast.error("حدث خطأ في حفظ الإعدادات");
    } finally {
      setSavingAttendance(false);
    }
  };

  const saveProduction = async () => {
    setSavingProduction(true);
    try {
      const res = await fetch("/api/settings/bonus", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "production", rules: production }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ إعدادات بونص الانتاج");
    } catch {
      toast.error("حدث خطأ في حفظ الإعدادات");
    } finally {
      setSavingProduction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            إعدادات بونص الانتظام
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullAttendanceBonus">بونص الانتظام الكامل</Label>
            <Input
              id="fullAttendanceBonus"
              type="number"
              value={attendance.fullAttendanceBonus}
              onChange={(e) =>
                setAttendance({
                  ...attendance,
                  fullAttendanceBonus: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAbsenceDays">أقصى أيام غياب</Label>
            <Input
              id="maxAbsenceDays"
              type="number"
              value={attendance.maxAbsenceDays}
              onChange={(e) =>
                setAttendance({
                  ...attendance,
                  maxAbsenceDays: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lateDeductionPerDay">خصم التأخير اليومي</Label>
            <Input
              id="lateDeductionPerDay"
              type="number"
              value={attendance.lateDeductionPerDay}
              onChange={(e) =>
                setAttendance({
                  ...attendance,
                  lateDeductionPerDay: Number(e.target.value),
                })
              }
            />
          </div>
          <Button
            onClick={saveAttendance}
            disabled={savingAttendance}
            className="w-full"
          >
            <Save className="h-4 w-4" />
            {savingAttendance ? "جاري الحفظ..." : "حفظ إعدادات الانتظام"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUpIcon className="h-5 w-5 text-blue-500" />
            إعدادات بونص الانتاج
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetPerDay">التارجت اليومي</Label>
            <Input
              id="targetPerDay"
              type="number"
              value={production.targetPerDay}
              onChange={(e) =>
                setProduction({
                  ...production,
                  targetPerDay: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bonusPerPiece">بونص لكل قطعة زيادة</Label>
            <Input
              id="bonusPerPiece"
              type="number"
              step="0.5"
              value={production.bonusPerPiece}
              onChange={(e) =>
                setProduction({
                  ...production,
                  bonusPerPiece: Number(e.target.value),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimumDays">أقل عدد أيام عمل</Label>
            <Input
              id="minimumDays"
              type="number"
              value={production.minimumDays}
              onChange={(e) =>
                setProduction({
                  ...production,
                  minimumDays: Number(e.target.value),
                })
              }
            />
          </div>
          <Button
            onClick={saveProduction}
            disabled={savingProduction}
            className="w-full"
          >
            <Save className="h-4 w-4" />
            {savingProduction ? "جاري الحفظ..." : "حفظ إعدادات الانتاج"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      const data = await res.json();
      setWebhooks(data);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const createWebhook = async () => {
    if (!newUrl || newEvents.length === 0) {
      toast.error("الرابط والأحداث مطلوبين");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم إضافة الويب هوك بنجاح");
      setNewUrl("");
      setNewEvents([]);
      setShowAdd(false);
      fetchWebhooks();
    } catch {
      toast.error("حدث خطأ في إضافة الويب هوك");
    } finally {
      setCreating(false);
    }
  };

  const deleteWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("تم حذف الويب هوك");
      setWebhooks(webhooks.filter((w) => w.id !== id));
    } catch {
      toast.error("حدث خطأ في حذف الويب هوك");
    }
  };

  const toggleEvent = (event: string) => {
    setNewEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Webhook Endpoints</h3>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة Webhook
        </Button>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد Webhook endpoints مسجلة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((wh) => (
            <Card key={wh.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {wh.url}
                      </code>
                      <Badge variant={wh.isActive ? "success" : "secondary"}>
                        {wh.isActive ? "نشط" : "معطل"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {wh.events.map((event) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        Secret: ••••{wh.secret.slice(-4)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(wh.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>

                    {wh.logs.length > 0 && (
                      <div>
                        <button
                          onClick={() =>
                            setExpandedLogs(
                              expandedLogs === wh.id ? null : wh.id
                            )
                          }
                          className="text-xs text-primary hover:underline"
                        >
                          {expandedLogs === wh.id
                            ? "إخفاء السجلات"
                            : `عرض آخر ${wh.logs.length} سجل`}
                        </button>
                        {expandedLogs === wh.id && (
                          <div className="mt-2 space-y-2">
                            {wh.logs.map((log) => (
                              <div
                                key={log.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-xs"
                              >
                                <Badge
                                  variant={
                                    log.statusCode &&
                                    log.statusCode >= 200 &&
                                    log.statusCode < 300
                                      ? "success"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {log.statusCode || "—"}
                                </Badge>
                                <span className="font-mono">{log.event}</span>
                                <span className="text-muted-foreground mr-auto">
                                  {new Date(log.createdAt).toLocaleString(
                                    "ar-EG"
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteWebhook(wh.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إضافة Webhook جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://example.com/webhook"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>الأحداث</Label>
              <div className="grid grid-cols-2 gap-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label
                    key={event.value}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm",
                      newEvents.includes(event.value)
                        ? "border-primary bg-primary/5"
                        : "border-input hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={newEvents.includes(event.value)}
                      onChange={() => toggleEvent(event.value)}
                      className="rounded"
                    />
                    {event.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              إلغاء
            </Button>
            <Button onClick={createWebhook} disabled={creating}>
              {creating ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      const data = await res.json();
      setKeys(data);
    } catch (error) {
      console.error("Error fetching API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const createKey = async () => {
    if (!newName || newPermissions.length === 0) {
      toast.error("الاسم والصلاحيات مطلوبين");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          permissions: newPermissions,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCreatedKey(data.key);
      toast.success("تم إنشاء المفتاح بنجاح");
      setNewName("");
      setNewPermissions([]);
      fetchKeys();
    } catch {
      toast.error("حدث خطأ في إنشاء المفتاح");
    } finally {
      setCreating(false);
    }
  };

  const deleteKey = async (id: string) => {
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("تم حذف المفتاح");
      setKeys(keys.filter((k) => k.id !== id));
    } catch {
      toast.error("حدث خطأ في حذف المفتاح");
    }
  };

  const copyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePermission = (perm: string) => {
    setNewPermissions((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Keys</h3>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          إنشاء مفتاح جديد
        </Button>
      </div>

      {keys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد مفاتيح API</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {keys.map((apiKey) => (
            <Card key={apiKey.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{apiKey.name}</span>
                      <Badge
                        variant={apiKey.isActive ? "success" : "secondary"}
                      >
                        {apiKey.isActive ? "نشط" : "معطل"}
                      </Badge>
                    </div>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded block w-fit">
                      {apiKey.key}
                    </code>
                    <div className="flex flex-wrap gap-1.5">
                      {apiKey.permissions.map((perm) => (
                        <Badge
                          key={perm}
                          variant="outline"
                          className="text-xs"
                        >
                          {perm}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        أنشئ:{" "}
                        {new Date(apiKey.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                      {apiKey.lastUsedAt && (
                        <span>
                          آخر استخدام:{" "}
                          {new Date(apiKey.lastUsedAt).toLocaleDateString(
                            "ar-EG"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteKey(apiKey.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={showCreate}
        onOpenChange={(open: boolean) => {
          setShowCreate(open);
          if (!open) {
            setCreatedKey(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء مفتاح API جديد</DialogTitle>
          </DialogHeader>

          {createdKey ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    احفظ هذا المفتاح الآن - لن يظهر مرة أخرى
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <code
                    className="flex-1 text-xs font-mono bg-white dark:bg-black p-2 rounded border break-all"
                    dir="ltr"
                  >
                    {createdKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyKey}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setShowCreate(false);
                    setCreatedKey(null);
                  }}
                >
                  تم
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">اسم المفتاح</Label>
                  <Input
                    id="key-name"
                    placeholder="مثال: تطبيق الموبايل"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الصلاحيات</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {API_PERMISSIONS.map((perm) => (
                      <label
                        key={perm.value}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm",
                          newPermissions.includes(perm.value)
                            ? "border-primary bg-primary/5"
                            : "border-input hover:bg-muted/50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={newPermissions.includes(perm.value)}
                          onChange={() => togglePermission(perm.value)}
                          className="rounded"
                        />
                        {perm.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowCreate(false)}
                >
                  إلغاء
                </Button>
                <Button onClick={createKey} disabled={creating}>
                  {creating ? "جاري الإنشاء..." : "إنشاء المفتاح"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DataManagementTab() {
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const seedDemoData = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "garment-factory-setup-2024", action: "seed-demo" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`تم إضافة البيانات التجريبية: ${data.employees} موظف، ${data.clients} عميل، ${data.orders} أوردر`);
      } else {
        toast.info(data.message || "البيانات موجودة بالفعل");
      }
    } catch {
      toast.error("حدث خطأ في إضافة البيانات");
    } finally {
      setSeeding(false);
    }
  };

  const clearDemoData = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "garment-factory-setup-2024", action: "clear-demo" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("تم مسح جميع البيانات التجريبية بنجاح");
      } else {
        toast.error(data.error || "حدث خطأ");
      }
    } catch {
      toast.error("حدث خطأ في مسح البيانات");
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-5 w-5 text-blue-500" />
            إضافة بيانات تجريبية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            إضافة بيانات تجريبية للنظام تشمل: موظفين، معدات، عملاء، أوردرات، سجلات حضور وإنتاج لآخر 7 أيام، وإعدادات البونص.
          </p>
          <Button onClick={seedDemoData} disabled={seeding} className="w-full gap-2">
            <Download className="h-4 w-4" />
            {seeding ? "جاري الإضافة..." : "إضافة البيانات التجريبية"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <XCircle className="h-5 w-5" />
            مسح البيانات التجريبية
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            مسح جميع البيانات من النظام (موظفين، عملاء، أوردرات، حضور، إنتاج...). سيتم الاحتفاظ بالأدوار والمستخدمين فقط.
          </p>
          {!confirmClear ? (
            <Button
              variant="destructive"
              onClick={() => setConfirmClear(true)}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              مسح جميع البيانات
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</p>
              <div className="flex gap-2">
                <Button variant="destructive" onClick={clearDemoData} disabled={clearing} className="flex-1 gap-2">
                  <Trash2 className="h-4 w-4" />
                  {clearing ? "جاري المسح..." : "تأكيد المسح"}
                </Button>
                <Button variant="outline" onClick={() => setConfirmClear(false)} className="flex-1">
                  إلغاء
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
