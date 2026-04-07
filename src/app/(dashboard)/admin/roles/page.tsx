"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Shield, Users } from "lucide-react";
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
import {
  PERMISSION_MODULES,
  type PermissionValue,
  type Permissions,
} from "@/lib/permissions";

const BOOLEAN_ONLY_MODULES = new Set([
  "dashboard",
  "reports",
  "ai",
  "settings",
  "admin",
  "guest_links",
]);

interface Role {
  id: string;
  name: string;
  label: string;
  permissions: Permissions;
  isSystem: boolean;
  _count: { users: number };
}

interface RoleForm {
  name: string;
  label: string;
  permissions: Permissions;
}

const emptyForm: RoleForm = {
  name: "",
  label: "",
  permissions: {},
};

function buildPermissionsSummary(permissions: Permissions): string {
  const granted = PERMISSION_MODULES.filter((m) => permissions[m.key]);
  if (granted.length === 0) return "بدون صلاحيات";
  if (granted.length === PERMISSION_MODULES.length) return "جميع الصلاحيات";
  return granted.map((m) => m.label).join("، ");
}

function getPermissionBadge(value: PermissionValue | undefined) {
  if (!value) return <Badge variant="outline">ممنوع</Badge>;
  if (value === "read")
    return <Badge variant="warning">قراءة</Badge>;
  return <Badge variant="success">كامل</Badge>;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>(emptyForm);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoles(data);
    } catch {
      toast.error("فشل في جلب الأدوار");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(role: Role) {
    setEditingId(role.id);
    setForm({
      name: role.name,
      label: role.label,
      permissions: { ...role.permissions },
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(role: Role) {
    setDeletingRole(role);
    setDeleteDialogOpen(true);
  }

  function setPermission(moduleKey: string, value: PermissionValue | false) {
    setForm((prev) => {
      const next = { ...prev.permissions };
      if (value === false) {
        delete next[moduleKey];
      } else {
        next[moduleKey] = value;
      }
      return { ...prev, permissions: next };
    });
  }

  function toggleBooleanPermission(moduleKey: string) {
    setForm((prev) => {
      const next = { ...prev.permissions };
      if (next[moduleKey]) {
        delete next[moduleKey];
      } else {
        next[moduleKey] = true;
      }
      return { ...prev, permissions: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.label) {
      toast.error("يرجى ملء اسم الدور والعنوان");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        label: form.label,
        permissions: form.permissions,
      };

      const url = editingId
        ? `/api/admin/roles/${editingId}`
        : "/api/admin/roles";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success(
        editingId ? "تم تعديل الدور بنجاح" : "تم إضافة الدور بنجاح"
      );
      setDialogOpen(false);
      fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingRole) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${deletingRole.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل في حذف الدور");
      }

      toast.success("تم حذف الدور بنجاح");
      setDeleteDialogOpen(false);
      setDeletingRole(null);
      fetchRoles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل في حذف الدور");
    } finally {
      setSaving(false);
    }
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
        title="إدارة الأدوار والصلاحيات"
        description="إنشاء وتعديل أدوار المستخدمين وصلاحياتهم"
        action={{ label: "إضافة دور جديد", icon: Plus, onClick: openAddDialog }}
      />

      <div className="rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-right px-4 py-3 font-medium">الدور</th>
                <th className="text-right px-4 py-3 font-medium">الصلاحيات</th>
                <th className="text-center px-4 py-3 font-medium">النوع</th>
                <th className="text-center px-4 py-3 font-medium">المستخدمين</th>
                <th className="text-center px-4 py-3 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    لا يوجد أدوار
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary shrink-0" />
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {role.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">
                        {buildPermissionsSummary(role.permissions)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {role.isSystem ? (
                        <Badge variant="secondary">نظام</Badge>
                      ) : (
                        <Badge variant="outline">مخصص</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{role._count.users}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(role)}
                          title="تعديل"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(role)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل الدور" : "إضافة دور جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "قم بتعديل بيانات الدور والصلاحيات"
                : "أدخل بيانات الدور الجديد وحدد الصلاحيات"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">المعرّف (بالإنجليزية) *</Label>
                <Input
                  id="roleName"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثال: accountant"
                  required
                  dir="ltr"
                  className="text-left"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleLabel">اسم الدور (بالعربية) *</Label>
                <Input
                  id="roleLabel"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="مثال: محاسب"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">الصلاحيات</Label>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-right px-4 py-2.5 font-medium">
                        الوحدة
                      </th>
                      <th className="text-center px-3 py-2.5 font-medium w-24">
                        الصلاحية
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSION_MODULES.map((mod) => {
                      const isBooleanOnly = BOOLEAN_ONLY_MODULES.has(mod.key);
                      const currentValue = form.permissions[mod.key];

                      return (
                        <tr
                          key={mod.key}
                          className="border-b last:border-0 hover:bg-muted/20"
                        >
                          <td className="px-4 py-2.5 font-medium">
                            {mod.label}
                          </td>
                          <td className="px-3 py-2.5">
                            {isBooleanOnly ? (
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleBooleanPermission(mod.key)
                                  }
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                    currentValue
                                      ? "bg-primary"
                                      : "bg-muted-foreground/30"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${
                                      currentValue
                                        ? "-translate-x-5"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPermission(mod.key, false)
                                  }
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    !currentValue
                                      ? "bg-destructive/10 text-destructive border border-destructive/30"
                                      : "text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  ممنوع
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPermission(mod.key, "read")
                                  }
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    currentValue === "read"
                                      ? "bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
                                      : "text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  قراءة
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPermission(mod.key, "full")
                                  }
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                                    currentValue === true ||
                                    currentValue === "full"
                                      ? "bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                                      : "text-muted-foreground hover:bg-muted"
                                  }`}
                                >
                                  كامل
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
                {saving
                  ? "جاري الحفظ..."
                  : editingId
                    ? "حفظ التعديلات"
                    : "إضافة"}
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
              هل أنت متأكد من حذف الدور &quot;{deletingRole?.label}&quot;؟ لا
              يمكن التراجع عن هذا الإجراء.
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
