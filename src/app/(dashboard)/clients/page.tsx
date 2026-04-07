"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatNumber } from "@/lib/utils";
import type { Client } from "@/generated/prisma/client";

type ClientWithCount = Client & { _count: { orders: number } };

interface ClientForm {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

const emptyForm: ClientForm = {
  name: "",
  phone: "",
  address: "",
  notes: "",
};

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientWithCount | null>(
    null
  );
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(data);
    } catch {
      toast.error("فشل في جلب بيانات العملاء");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(client: ClientWithCount) {
    setEditingId(client.id);
    setForm({
      name: client.name,
      phone: client.phone || "",
      address: client.address || "",
      notes: client.notes || "",
    });
    setDialogOpen(true);
  }

  function openDeleteDialog(client: ClientWithCount) {
    setDeletingClient(client);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) {
      toast.error("يرجى إدخال اسم العميل");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        address: form.address || null,
        notes: form.notes || null,
      };

      const url = editingId ? `/api/clients/${editingId}` : "/api/clients";
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
        editingId ? "تم تعديل العميل بنجاح" : "تم إضافة العميل بنجاح"
      );
      setDialogOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingClient) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${deletingClient.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("تم حذف العميل بنجاح");
      setDeleteDialogOpen(false);
      setDeletingClient(null);
      fetchClients();
    } catch {
      toast.error("فشل في حذف العميل");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<ClientWithCount>[] = [
    { key: "name", header: "الاسم" },
    { key: "phone", header: "التليفون", render: (c) => c.phone || "—" },
    { key: "address", header: "العنوان", render: (c) => c.address || "—" },
    {
      key: "_count",
      header: "عدد الأوردرات",
      searchable: false,
      render: (c) => formatNumber(c._count.orders),
    },
    {
      key: "actions",
      header: "إجراءات",
      searchable: false,
      render: (c) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(c);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(c);
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
        title="إدارة العملاء"
        description="عرض وإدارة بيانات جميع العملاء"
        action={{ label: "إضافة عميل", icon: Plus, onClick: openAddDialog }}
      />

      <DataTable
        data={clients}
        columns={columns}
        searchPlaceholder="بحث بالاسم أو التليفون أو العنوان..."
        emptyMessage="لا يوجد عملاء"
        onRowClick={openEditDialog}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "قم بتعديل بيانات العميل ثم اضغط حفظ"
                : "أدخل بيانات العميل الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">الاسم *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم العميل"
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

            <div className="space-y-2">
              <Label htmlFor="address">العنوان</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="عنوان العميل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
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
              هل أنت متأكد من حذف العميل &quot;{deletingClient?.name}&quot;؟
              سيتم حذف جميع بياناته وأوردراته نهائياً.
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
