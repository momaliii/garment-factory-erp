"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, UserCog, Link2 } from "lucide-react";
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
import { DataTable, type Column } from "@/components/shared/data-table";

interface Role {
  id: string;
  name: string;
  label: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  roleId: string;
  employeeId: string | null;
  employee?: { id: string; name: string } | null;
}

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface UserForm {
  username: string;
  password: string;
  name: string;
  roleId: string;
  employeeId: string;
}

const emptyForm: UserForm = {
  username: "",
  password: "",
  name: "",
  roleId: "",
  employeeId: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data);
    } catch {
      toast.error("فشل في جلب بيانات المستخدمين");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRoles(data);
    } catch {
      console.error("Failed to fetch roles");
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data);
    } catch {
      console.error("Failed to fetch employees");
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.id);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchEmployees();
    fetchCurrentUser();
  }, [fetchUsers, fetchRoles, fetchEmployees, fetchCurrentUser]);

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(user: User) {
    setEditingId(user.id);
    setForm({
      username: user.username,
      password: "",
      name: user.name,
      roleId: user.roleId,
      employeeId: user.employeeId || "",
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(user: User) {
    if (user.id === currentUserId) {
      toast.error("لا يمكنك حذف حسابك الخاص");
      return;
    }
    setDeletingUser(user);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.username || !form.name || !form.roleId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!editingId && !form.password) {
      toast.error("كلمة المرور مطلوبة عند إنشاء مستخدم جديد");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string | null | undefined> = {
        username: form.username,
        name: form.name,
        roleId: form.roleId,
        employeeId: form.employeeId || null,
      };

      if (form.password) {
        payload.password = form.password;
      }

      const url = editingId
        ? `/api/admin/users/${editingId}`
        : "/api/admin/users";
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
        editingId ? "تم تعديل المستخدم بنجاح" : "تم إضافة المستخدم بنجاح"
      );
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingUser) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "فشل في حذف المستخدم");
      }

      toast.success("تم حذف المستخدم بنجاح");
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل في حذف المستخدم");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<User>[] = [
    { key: "username", header: "اسم المستخدم" },
    { key: "name", header: "الاسم" },
    {
      key: "role",
      header: "الدور",
      render: (user) => (
        <Badge variant="secondary">
          <UserCog className="h-3 w-3 me-1" />
          {user.role?.label || "—"}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: "employeeId",
      header: "مرتبط بموظف",
      render: (user) =>
        user.employee ? (
          <span className="flex items-center gap-1 text-sm">
            <Link2 className="h-3 w-3 text-muted-foreground" />
            {user.employee.name}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
      searchable: false,
    },
    {
      key: "actions",
      header: "إجراءات",
      searchable: false,
      render: (user) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(user);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={user.id === currentUserId}
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(user);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

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
        title="إدارة المستخدمين"
        description="عرض وإدارة حسابات مستخدمي النظام"
        action={{
          label: "إضافة مستخدم جديد",
          icon: Plus,
          onClick: openAddDialog,
        }}
      />

      <DataTable
        data={users as unknown as Record<string, unknown>[]}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        searchPlaceholder="بحث بالاسم أو اسم المستخدم..."
        emptyMessage="لا يوجد مستخدمين"
        onRowClick={(row) => openEditDialog(row as unknown as User)}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "قم بتعديل بيانات المستخدم ثم اضغط حفظ"
                : "أدخل بيانات المستخدم الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم *</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) =>
                  setForm({ ...form, username: e.target.value })
                }
                placeholder="اسم المستخدم للدخول"
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                كلمة المرور {editingId ? "(اتركها فارغة إن لم ترد التغيير)" : "*"}
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                placeholder={
                  editingId
                    ? "اتركها فارغة للإبقاء على كلمة المرور الحالية"
                    : "كلمة المرور"
                }
                required={!editingId}
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="الاسم الكامل"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roleId">الدور *</Label>
              <Select
                id="roleId"
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                required
              >
                <option value="">اختر الدور</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="employeeId">ربط بموظف</Label>
              <Select
                id="employeeId"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
              >
                <option value="">بدون ربط</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.role}
                  </option>
                ))}
              </Select>
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
              هل أنت متأكد من حذف المستخدم &quot;{deletingUser?.name}&quot;؟
              لا يمكن التراجع عن هذا الإجراء.
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
