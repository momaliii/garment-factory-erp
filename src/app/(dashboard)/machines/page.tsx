"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Settings, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { getMachineTypeLabel, getMachineStatusLabel } from "@/lib/utils";
import type { Machine, Employee } from "@/generated/prisma/client";

type MachineWithEmployees = Machine & { employees: Employee[] };

interface MachineForm {
  name: string;
  type: string;
  status: string;
}

const emptyForm: MachineForm = {
  name: "",
  type: "overlock",
  status: "active",
};

const machineTypes = [
  "overlock",
  "surger",
  "single",
  "elastic",
  "press",
  "iron",
  "cutting",
  "packing",
] as const;

function getStatusVariant(status: string) {
  switch (status) {
    case "active":
      return "success" as const;
    case "broken":
      return "destructive" as const;
    case "maintenance":
      return "warning" as const;
    default:
      return "secondary" as const;
  }
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<MachineWithEmployees[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingMachine, setDeletingMachine] =
    useState<MachineWithEmployees | null>(null);
  const [form, setForm] = useState<MachineForm>(emptyForm);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch("/api/machines");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMachines(data);
    } catch {
      toast.error("فشل في جلب بيانات المعدات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(machine: MachineWithEmployees) {
    setEditingId(machine.id);
    setForm({
      name: machine.name,
      type: machine.type,
      status: machine.status,
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(machine: MachineWithEmployees) {
    setDeletingMachine(machine);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.type) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/machines/${editingId}` : "/api/machines";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success(
        editingId ? "تم تعديل المعدة بنجاح" : "تم إضافة المعدة بنجاح"
      );
      setDialogOpen(false);
      fetchMachines();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingMachine) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/machines/${deletingMachine.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("تم حذف المعدة بنجاح");
      setDeleteDialogOpen(false);
      setDeletingMachine(null);
      fetchMachines();
    } catch {
      toast.error("فشل في حذف المعدة");
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
        title="إدارة المعدات"
        description="عرض وإدارة جميع معدات المصنع"
        action={{ label: "إضافة معدة", icon: Plus, onClick: openAddDialog }}
      />

      {machines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Settings className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">لا توجد معدات</p>
          <p className="text-sm">اضغط على &quot;إضافة معدة&quot; لإضافة معدة جديدة</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {machines.map((machine) => (
            <Card
              key={machine.id}
              className="group relative hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openEditDialog(machine)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-semibold">
                    {machine.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(machine);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteDialog(machine);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
                <Badge variant={getStatusVariant(machine.status)} className="w-fit">
                  {getMachineStatusLabel(machine.status)}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Settings className="h-4 w-4" />
                  <span>{getMachineTypeLabel(machine.type)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {machine.employees.length > 0
                      ? machine.employees.map((e) => e.name).join("، ")
                      : "لا يوجد موظفين"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل بيانات المعدة" : "إضافة معدة جديدة"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "قم بتعديل بيانات المعدة ثم اضغط حفظ"
                : "أدخل بيانات المعدة الجديدة"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المعدة *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: مكنة 1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">النوع *</Label>
              <Select
                id="type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {machineTypes.map((t) => (
                  <option key={t} value={t}>
                    {getMachineTypeLabel(t)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">الحالة</Label>
              <Select
                id="status"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">شغالة</option>
                <option value="broken">عطلانة</option>
                <option value="maintenance">صيانة</option>
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
              هل أنت متأكد من حذف المعدة &quot;{deletingMachine?.name}&quot;؟
              سيتم حذفها نهائياً.
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
