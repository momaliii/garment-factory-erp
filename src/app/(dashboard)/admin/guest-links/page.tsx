"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Link as LinkIcon,
  Clock,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { PERMISSION_MODULES } from "@/lib/permissions";

interface GuestLink {
  id: string;
  name: string;
  token: string;
  permissions: Record<string, boolean>;
  expiresAt: string;
  maxVisits: number | null;
  visitCount: number;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string };
}

interface LinkForm {
  name: string;
  permissions: Record<string, boolean>;
  expiry: string;
  maxVisits: string;
}

const EXPIRY_OPTIONS = [
  { value: "1h", label: "ساعة واحدة" },
  { value: "6h", label: "٦ ساعات" },
  { value: "24h", label: "٢٤ ساعة" },
  { value: "3d", label: "٣ أيام" },
  { value: "7d", label: "٧ أيام" },
  { value: "30d", label: "٣٠ يوم" },
];

function getExpiresAt(expiry: string): string {
  const now = new Date();
  const map: Record<string, number> = {
    "1h": 3600000,
    "6h": 21600000,
    "24h": 86400000,
    "3d": 259200000,
    "7d": 604800000,
    "30d": 2592000000,
  };
  return new Date(now.getTime() + (map[expiry] || 86400000)).toISOString();
}

function getLinkStatus(link: GuestLink) {
  if (!link.isActive) return { label: "معطل", variant: "secondary" as const };
  if (new Date(link.expiresAt) < new Date())
    return { label: "منتهي", variant: "destructive" as const };
  if (link.maxVisits && link.visitCount >= link.maxVisits)
    return { label: "استنفذ الزيارات", variant: "warning" as const };
  return { label: "نشط", variant: "success" as const };
}

const emptyForm: LinkForm = {
  name: "",
  permissions: {},
  expiry: "24h",
  maxVisits: "",
};

const GUEST_MODULES = PERMISSION_MODULES.filter(
  (m) => !["admin", "guest_links", "settings"].includes(m.key)
);

export default function GuestLinksPage() {
  const [links, setLinks] = useState<GuestLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingLink, setDeletingLink] = useState<GuestLink | null>(null);
  const [form, setForm] = useState<LinkForm>(emptyForm);

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guest-links");
      if (!res.ok) throw new Error();
      setLinks(await res.json());
    } catch {
      toast.error("فشل في جلب اللينكات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  function togglePermission(key: string) {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("يرجى إدخال اسم اللينك");
      return;
    }

    const selectedPermissions = Object.entries(form.permissions).filter(
      ([, v]) => v
    );
    if (selectedPermissions.length === 0) {
      toast.error("يرجى اختيار صلاحية واحدة على الأقل");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/guest-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          permissions: form.permissions,
          expiresAt: getExpiresAt(form.expiry),
          maxVisits: form.maxVisits ? Number(form.maxVisits) : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success("تم إنشاء اللينك بنجاح");
      setDialogOpen(false);
      setForm(emptyForm);
      fetchLinks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingLink) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/guest-links/${deletingLink.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("تم حذف اللينك");
      setDeleteDialogOpen(false);
      setDeletingLink(null);
      fetchLinks();
    } catch {
      toast.error("فشل في حذف اللينك");
    } finally {
      setSaving(false);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/guest/${token}`;
    navigator.clipboard.writeText(url).then(
      () => toast.success("تم نسخ اللينك"),
      () => toast.error("فشل في نسخ اللينك")
    );
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function permissionsSummary(permissions: Record<string, boolean>) {
    const active = PERMISSION_MODULES.filter((m) => permissions[m.key]);
    if (active.length === 0) return "لا صلاحيات";
    if (active.length <= 3) return active.map((m) => m.label).join("، ");
    return `${active
      .slice(0, 2)
      .map((m) => m.label)
      .join("، ")} +${active.length - 2}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة اللينكات المؤقتة"
        description="إنشاء وإدارة روابط مؤقتة للعرض بدون تسجيل دخول"
        action={{
          label: "إنشاء لينك مؤقت",
          icon: Plus,
          onClick: () => {
            setForm(emptyForm);
            setDialogOpen(true);
          },
        }}
      />

      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <LinkIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">لا توجد لينكات مؤقتة</h3>
          <p className="text-muted-foreground text-sm">
            أنشئ لينك مؤقت لمشاركة بيانات المصنع للقراءة فقط
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => {
            const status = getLinkStatus(link);
            return (
              <div
                key={link.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base truncate">
                      {link.name}
                    </h3>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      ينتهي: {formatDate(link.expiresAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {link.visitCount}
                      {link.maxVisits ? ` / ${link.maxVisits}` : ""} زيارة
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    الصلاحيات: {permissionsSummary(link.permissions)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    أنشأه: {link.createdBy.name} -{" "}
                    {formatDate(link.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(link.token)}
                    className="gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    نسخ اللينك
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setDeletingLink(link);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Link Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>إنشاء لينك مؤقت</DialogTitle>
            <DialogDescription>
              أنشئ رابط مؤقت لمشاركة بيانات المصنع للقراءة فقط
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="linkName">الاسم</Label>
              <Input
                id="linkName"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: عرض للعميل أحمد"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>الصلاحيات</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {GUEST_MODULES.map((mod) => (
                  <label
                    key={mod.key}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                      form.permissions[mod.key]
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!form.permissions[mod.key]}
                      onChange={() => togglePermission(mod.key)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        form.permissions[mod.key]
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {form.permissions[mod.key] && (
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">مدة الصلاحية</Label>
                <Select
                  id="expiry"
                  value={form.expiry}
                  onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                >
                  {EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxVisits">عدد مرات الزيارة</Label>
                <Input
                  id="maxVisits"
                  type="number"
                  min="1"
                  value={form.maxVisits}
                  onChange={(e) =>
                    setForm({ ...form, maxVisits: e.target.value })
                  }
                  placeholder="بدون حد"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "جاري الإنشاء..." : "إنشاء اللينك"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف اللينك &quot;{deletingLink?.name}&quot;؟ لن
              يتمكن أي شخص من استخدامه بعد الحذف.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
