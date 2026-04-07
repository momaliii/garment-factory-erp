"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { formatCurrency, getPaymentTypeLabel } from "@/lib/utils";
import type { Employee, Machine } from "@/generated/prisma/client";

type EmployeeWithMachine = Employee & { machine: Machine | null };

interface EmployeeForm {
  name: string;
  role: string;
  phone: string;
  baseSalary: string;
  paymentType: string;
  machineId: string;
}

const emptyForm: EmployeeForm = {
  name: "",
  role: "",
  phone: "",
  baseSalary: "",
  paymentType: "monthly",
  machineId: "",
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeWithMachine[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeWithMachine | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data);
    } catch {
      toast.error("فشل في جلب بيانات الموظفين");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch("/api/machines");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMachines(data);
    } catch {
      console.error("Failed to fetch machines");
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchMachines();
  }, [fetchEmployees, fetchMachines]);

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(employee: EmployeeWithMachine) {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      role: employee.role,
      phone: employee.phone || "",
      baseSalary: String(employee.baseSalary),
      paymentType: employee.paymentType,
      machineId: employee.machineId || "",
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(employee: EmployeeWithMachine) {
    setDeletingEmployee(employee);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.role || !form.baseSalary) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        phone: form.phone || null,
        baseSalary: Number(form.baseSalary),
        paymentType: form.paymentType,
        machineId: form.machineId || null,
      };

      const url = editingId ? `/api/employees/${editingId}` : "/api/employees";
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

      toast.success(editingId ? "تم تعديل الموظف بنجاح" : "تم إضافة الموظف بنجاح");
      setDialogOpen(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingEmployee) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${deletingEmployee.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("تم تعطيل الموظف بنجاح");
      setDeleteDialogOpen(false);
      setDeletingEmployee(null);
      fetchEmployees();
    } catch {
      toast.error("فشل في حذف الموظف");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<EmployeeWithMachine>[] = [
    { key: "name", header: "الاسم" },
    { key: "role", header: "الوظيفة" },
    { key: "phone", header: "التليفون", render: (emp) => emp.phone || "—" },
    {
      key: "baseSalary",
      header: "المرتب الأساسي",
      render: (emp) => formatCurrency(emp.baseSalary),
      searchable: false,
    },
    {
      key: "paymentType",
      header: "نوع الراتب",
      render: (emp) => (
        <Badge variant={emp.paymentType === "monthly" ? "default" : "secondary"}>
          {getPaymentTypeLabel(emp.paymentType)}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: "machineId",
      header: "المكنة",
      render: (emp) => emp.machine?.name || "—",
      searchable: false,
    },
    {
      key: "isActive",
      header: "الحالة",
      render: (emp) => (
        <Badge variant={emp.isActive ? "success" : "destructive"}>
          {emp.isActive ? "نشط" : "غير نشط"}
        </Badge>
      ),
      searchable: false,
    },
    {
      key: "actions",
      header: "إجراءات",
      searchable: false,
      render: (emp) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(emp);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          {emp.isActive && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                openDeleteDialog(emp);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
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
        title="إدارة الموظفين"
        description="عرض وإدارة بيانات جميع الموظفين"
        action={{ label: "إضافة موظف", icon: Plus, onClick: openAddDialog }}
      />

      <DataTable
        data={employees}
        columns={columns}
        searchPlaceholder="بحث بالاسم أو الوظيفة أو التليفون..."
        emptyMessage="لا يوجد موظفين"
        onRowClick={openEditDialog}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "قم بتعديل بيانات الموظف ثم اضغط حفظ"
                : "أدخل بيانات الموظف الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم الموظف"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">الوظيفة *</Label>
              <Input
                id="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="مثال: خياط، عامل كي، مشرف"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">التليفون</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="رقم التليفون"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseSalary">المرتب الأساسي *</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.baseSalary}
                  onChange={(e) =>
                    setForm({ ...form, baseSalary: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">نوع الراتب</Label>
                <Select
                  id="paymentType"
                  value={form.paymentType}
                  onChange={(e) =>
                    setForm({ ...form, paymentType: e.target.value })
                  }
                >
                  <option value="monthly">شهري</option>
                  <option value="weekly">أسبوعي</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="machineId">المكنة</Label>
              <Select
                id="machineId"
                value={form.machineId}
                onChange={(e) =>
                  setForm({ ...form, machineId: e.target.value })
                }
              >
                <option value="">بدون مكنة</option>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
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
                {saving ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد التعطيل</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من تعطيل الموظف &quot;{deletingEmployee?.name}&quot;؟
              سيتم تغيير حالته إلى غير نشط.
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
              {saving ? "جاري التعطيل..." : "تعطيل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
