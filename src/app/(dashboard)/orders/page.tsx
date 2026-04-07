"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Truck,
  Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import {
  formatNumber,
  formatCurrency,
  formatDate,
  todayString,
  getDaysRemaining,
  getOrderStatusLabel,
  getOrderStatusColor,
  cn,
} from "@/lib/utils";

interface Client {
  id: string;
  name: string;
}

interface OrderProgress {
  id: string;
  orderId: string;
  date: string;
  produced: number;
  delivered: number;
  notes: string | null;
  createdAt: string;
}

interface FabricRecord {
  id: string;
  orderId: string;
  date: string;
  fabricType: string | null;
  quantity: number;
  unit: string;
  notes: string | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  clientId: string;
  client: { id: string; name: string };
  type: string;
  description: string | null;
  totalQuantity: number;
  unitPrice: number;
  deadline: string;
  status: string;
  notes: string | null;
  createdAt: string;
  totalProduced: number;
  totalDelivered: number;
  remaining: number;
  daysLeft: number;
  orderProgress: OrderProgress[];
  fabricReceiving: FabricRecord[];
}

interface OrderForm {
  clientId: string;
  type: string;
  description: string;
  totalQuantity: string;
  unitPrice: string;
  deadline: string;
  notes: string;
}

const emptyForm: OrderForm = {
  clientId: "",
  type: "full",
  description: "",
  totalQuantity: "",
  unitPrice: "",
  deadline: "",
  notes: "",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [deletingOrder, setDeletingOrder] = useState<OrderItem | null>(null);

  const [form, setForm] = useState<OrderForm>(emptyForm);

  const [progressForm, setProgressForm] = useState({
    produced: "",
    delivered: "",
    notes: "",
  });
  const [fabricForm, setFabricForm] = useState({
    fabricType: "",
    quantity: "",
    unit: "meter",
    notes: "",
  });

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("فشل في جلب بيانات الأوردرات");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setClients(data);
    } catch {
      toast.error("فشل في جلب بيانات العملاء");
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchClients();
  }, [fetchOrders, fetchClients]);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (typeFilter && order.type !== typeFilter) return false;
    return true;
  });

  const activeCount = orders.filter((o) =>
    ["new", "in_progress"].includes(o.status)
  ).length;
  const delayedCount = orders.filter((o) => o.status === "delayed").length;
  const completedCount = orders.filter((o) =>
    ["completed", "delivered"].includes(o.status)
  ).length;

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setAddDialogOpen(true);
  }

  function openEditDialog(order: OrderItem) {
    setEditingId(order.id);
    setForm({
      clientId: order.clientId,
      type: order.type,
      description: order.description || "",
      totalQuantity: String(order.totalQuantity),
      unitPrice: String(order.unitPrice),
      deadline: order.deadline,
      notes: order.notes || "",
    });
    setAddDialogOpen(true);
  }

  async function openDetailDialog(order: OrderItem) {
    try {
      const res = await fetch(`/api/orders/${order.id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSelectedOrder(data);
      setDetailDialogOpen(true);
      setProgressForm({ produced: "", delivered: "", notes: "" });
      setFabricForm({ fabricType: "", quantity: "", unit: "meter", notes: "" });
    } catch {
      toast.error("فشل في جلب تفاصيل الأوردر");
    }
  }

  function openDeleteDialog(order: OrderItem) {
    setDeletingOrder(order);
    setDeleteDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.clientId ||
      !form.type ||
      !form.totalQuantity ||
      !form.unitPrice ||
      !form.deadline
    ) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/orders/${editingId}` : "/api/orders";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          type: form.type,
          description: form.description || null,
          totalQuantity: parseInt(form.totalQuantity),
          unitPrice: parseFloat(form.unitPrice),
          deadline: form.deadline,
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success(
        editingId ? "تم تعديل الأوردر بنجاح" : "تم إضافة الأوردر بنجاح"
      );
      setAddDialogOpen(false);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingOrder) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${deletingOrder.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();

      toast.success("تم حذف الأوردر بنجاح");
      setDeleteDialogOpen(false);
      setDeletingOrder(null);
      fetchOrders();
    } catch {
      toast.error("فشل في حذف الأوردر");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddProgress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!progressForm.produced && !progressForm.delivered) {
      toast.error("يرجى إدخال كمية الإنتاج أو التسليم");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/orders/${selectedOrder.id}/progress`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            produced: parseInt(progressForm.produced) || 0,
            delivered: parseInt(progressForm.delivered) || 0,
            notes: progressForm.notes || null,
            date: todayString(),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success("تم إضافة التقدم بنجاح");
      setProgressForm({ produced: "", delivered: "", notes: "" });
      await openDetailDialog(selectedOrder);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFabric(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!fabricForm.quantity) {
      toast.error("يرجى إدخال الكمية");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        `/api/orders/${selectedOrder.id}/fabric`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fabricType: fabricForm.fabricType || null,
            quantity: parseFloat(fabricForm.quantity),
            unit: fabricForm.unit,
            notes: fabricForm.notes || null,
            date: todayString(),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success("تم تسجيل استلام القماش بنجاح");
      setFabricForm({ fabricType: "", quantity: "", unit: "meter", notes: "" });
      await openDetailDialog(selectedOrder);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  function getTypeLabel(type: string) {
    return type === "full" ? "تصنيع كامل" : "تصنيع فقط (CMT)";
  }

  function getUnitLabel(unit: string) {
    const labels: Record<string, string> = {
      meter: "متر",
      kg: "كيلو",
      roll: "رولة",
    };
    return labels[unit] || unit;
  }

  function getDaysColor(daysLeft: number, status: string) {
    if (status === "completed" || status === "delivered") return "";
    if (daysLeft < 0) return "text-red-600 font-bold";
    if (daysLeft <= 7) return "text-yellow-600 font-bold";
    return "text-green-600";
  }

  function getRowClass(order: OrderItem) {
    if (order.status === "completed" || order.status === "delivered") return "";
    if (order.daysLeft < 0) return "bg-red-50 dark:bg-red-950/20";
    if (order.daysLeft <= 7) return "bg-yellow-50 dark:bg-yellow-950/20";
    return "";
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
        title="إدارة الأوردرات"
        description="عرض وإدارة جميع أوردرات المصنع"
        action={{ label: "إضافة أوردر", icon: Plus, onClick: openAddDialog }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="أوردرات نشطة"
          value={formatNumber(activeCount)}
          icon={Package}
          iconClassName="bg-blue-600"
        />
        <StatCard
          title="متأخرة"
          value={formatNumber(delayedCount)}
          icon={AlertTriangle}
          iconClassName="bg-red-600"
        />
        <StatCard
          title="مكتملة / تم التسليم"
          value={formatNumber(completedCount)}
          icon={CheckCircle}
          iconClassName="bg-green-600"
        />
        <StatCard
          title="إجمالي الأوردرات"
          value={formatNumber(orders.length)}
          icon={TrendingUp}
          iconClassName="bg-purple-600"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <Label>الحالة</Label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[180px]"
          >
            <option value="">الكل</option>
            <option value="new">جديد</option>
            <option value="in_progress">جاري التنفيذ</option>
            <option value="delayed">متأخر</option>
            <option value="completed">مكتمل</option>
            <option value="delivered">تم التسليم</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>النوع</Label>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-[180px]"
          >
            <option value="">الكل</option>
            <option value="full">تصنيع كامل</option>
            <option value="cmt">تصنيع فقط (CMT)</option>
          </Select>
        </div>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    العميل
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    النوع
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    الوصف
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    الكمية المطلوبة
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    تم الإنتاج
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    تم التسليم
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    الناقص
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    الديدلاين
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    باقي (أيام)
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    إجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      لا توجد أوردرات
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className={cn(
                        "border-b last:border-0 transition-colors hover:bg-muted/50 cursor-pointer",
                        getRowClass(order)
                      )}
                      onClick={() => openDetailDialog(order)}
                    >
                      <td className="px-4 py-3 font-medium">
                        {order.client.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{getTypeLabel(order.type)}</Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate">
                        {order.description || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(order.totalQuantity)}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(order.totalProduced)}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber(order.totalDelivered)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatNumber(order.remaining)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {formatDate(order.deadline)}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3",
                          getDaysColor(order.daysLeft, order.status)
                        )}
                      >
                        {order.status === "delivered"
                          ? "—"
                          : order.daysLeft < 0
                            ? `متأخر ${Math.abs(order.daysLeft)} يوم`
                            : `${order.daysLeft} يوم`}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={getOrderStatusColor(order.status)}
                        >
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailDialog(order);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(order);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteDialog(order);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Order Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "تعديل الأوردر" : "إضافة أوردر جديد"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "قم بتعديل بيانات الأوردر ثم اضغط حفظ"
                : "أدخل بيانات الأوردر الجديد"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">العميل *</Label>
                <Select
                  id="clientId"
                  value={form.clientId}
                  onChange={(e) =>
                    setForm({ ...form, clientId: e.target.value })
                  }
                >
                  <option value="">اختر العميل</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">النوع *</Label>
                <Select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="full">تصنيع كامل</option>
                  <option value="cmt">تصنيع فقط (CMT)</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">الوصف</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="وصف الأوردر (مثل: بنطلون جينز، تيشيرت قطن...)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalQuantity">الكمية المطلوبة *</Label>
                <Input
                  id="totalQuantity"
                  type="number"
                  min="1"
                  value={form.totalQuantity}
                  onChange={(e) =>
                    setForm({ ...form, totalQuantity: e.target.value })
                  }
                  placeholder="عدد القطع"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice">سعر القطعة *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) =>
                    setForm({ ...form, unitPrice: e.target.value })
                  }
                  placeholder="السعر بالجنيه"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">الديدلاين *</Label>
              <Input
                id="deadline"
                type="date"
                value={form.deadline}
                onChange={(e) =>
                  setForm({ ...form, deadline: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNotes">ملاحظات</Label>
              <Textarea
                id="orderNotes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
              />
            </div>

            {form.totalQuantity && form.unitPrice && (
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">إجمالي القيمة: </span>
                <span className="font-bold">
                  {formatCurrency(
                    parseInt(form.totalQuantity) * parseFloat(form.unitPrice)
                  )}
                </span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
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

      {/* Order Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  تفاصيل الأوردر - {selectedOrder.client.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.description || getTypeLabel(selectedOrder.type)}
                </DialogDescription>
              </DialogHeader>

              {/* Order Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">الكمية المطلوبة</p>
                  <p className="text-lg font-bold">
                    {formatNumber(selectedOrder.totalQuantity)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-center">
                  <p className="text-xs text-muted-foreground">تم الإنتاج</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatNumber(selectedOrder.totalProduced)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 text-center">
                  <p className="text-xs text-muted-foreground">تم التسليم</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatNumber(selectedOrder.totalDelivered)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 text-center">
                  <p className="text-xs text-muted-foreground">الناقص</p>
                  <p className="text-lg font-bold text-orange-600">
                    {formatNumber(selectedOrder.remaining)}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">تقدم الإنتاج</span>
                  <span className="font-medium">
                    {selectedOrder.totalQuantity > 0
                      ? Math.round(
                          (selectedOrder.totalProduced /
                            selectedOrder.totalQuantity) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        selectedOrder.totalQuantity > 0
                          ? (selectedOrder.totalProduced /
                              selectedOrder.totalQuantity) *
                              100
                          : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">النوع</span>
                  <Badge variant="outline">{getTypeLabel(selectedOrder.type)}</Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">الحالة</span>
                  <Badge className={getOrderStatusColor(selectedOrder.status)}>
                    {getOrderStatusLabel(selectedOrder.status)}
                  </Badge>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">سعر القطعة</span>
                  <span className="font-medium">{formatCurrency(selectedOrder.unitPrice)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">إجمالي القيمة</span>
                  <span className="font-medium">
                    {formatCurrency(
                      selectedOrder.totalQuantity * selectedOrder.unitPrice
                    )}
                  </span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">الديدلاين</span>
                  <span className="font-medium">{formatDate(selectedOrder.deadline)}</span>
                </div>
                <div className="flex justify-between p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground">الأيام المتبقية</span>
                  <span
                    className={cn(
                      "font-medium",
                      getDaysColor(
                        getDaysRemaining(selectedOrder.deadline),
                        selectedOrder.status
                      )
                    )}
                  >
                    {selectedOrder.status === "delivered"
                      ? "تم التسليم"
                      : getDaysRemaining(selectedOrder.deadline) < 0
                        ? `متأخر ${Math.abs(getDaysRemaining(selectedOrder.deadline))} يوم`
                        : `${getDaysRemaining(selectedOrder.deadline)} يوم`}
                  </span>
                </div>
              </div>

              {/* Add Progress Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    إضافة تقدم
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleAddProgress}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">عدد الإنتاج</Label>
                      <Input
                        type="number"
                        min="0"
                        value={progressForm.produced}
                        onChange={(e) =>
                          setProgressForm({
                            ...progressForm,
                            produced: e.target.value,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">عدد التسليم</Label>
                      <Input
                        type="number"
                        min="0"
                        value={progressForm.delivered}
                        onChange={(e) =>
                          setProgressForm({
                            ...progressForm,
                            delivered: e.target.value,
                          })
                        }
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">ملاحظات</Label>
                      <Input
                        value={progressForm.notes}
                        onChange={(e) =>
                          setProgressForm({
                            ...progressForm,
                            notes: e.target.value,
                          })
                        }
                        placeholder="ملاحظات..."
                      />
                    </div>
                    <Button type="submit" disabled={saving} size="sm">
                      {saving ? "جاري..." : "إضافة"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Progress History */}
              {selectedOrder.orderProgress &&
                selectedOrder.orderProgress.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        سجل التقدم
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                التاريخ
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                إنتاج
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                تسليم
                              </th>
                              <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                ملاحظات
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.orderProgress.map((p) => (
                              <tr
                                key={p.id}
                                className="border-b last:border-0"
                              >
                                <td className="px-3 py-2">
                                  {formatDate(p.date)}
                                </td>
                                <td className="px-3 py-2">
                                  {p.produced > 0 && (
                                    <Badge variant="secondary">
                                      +{formatNumber(p.produced)}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {p.delivered > 0 && (
                                    <Badge variant="success">
                                      +{formatNumber(p.delivered)}
                                    </Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">
                                  {p.notes || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Fabric Receiving Section (for CMT orders) */}
              {selectedOrder.type === "cmt" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Scissors className="h-4 w-4" />
                      استلام القماش
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form
                      onSubmit={handleAddFabric}
                      className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
                    >
                      <div className="space-y-1">
                        <Label className="text-xs">نوع القماش</Label>
                        <Input
                          value={fabricForm.fabricType}
                          onChange={(e) =>
                            setFabricForm({
                              ...fabricForm,
                              fabricType: e.target.value,
                            })
                          }
                          placeholder="قطن، بوليستر..."
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الكمية *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={fabricForm.quantity}
                          onChange={(e) =>
                            setFabricForm({
                              ...fabricForm,
                              quantity: e.target.value,
                            })
                          }
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">الوحدة</Label>
                        <Select
                          value={fabricForm.unit}
                          onChange={(e) =>
                            setFabricForm({
                              ...fabricForm,
                              unit: e.target.value,
                            })
                          }
                        >
                          <option value="meter">متر</option>
                          <option value="kg">كيلو</option>
                          <option value="roll">رولة</option>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">ملاحظات</Label>
                        <Input
                          value={fabricForm.notes}
                          onChange={(e) =>
                            setFabricForm({
                              ...fabricForm,
                              notes: e.target.value,
                            })
                          }
                          placeholder="ملاحظات..."
                        />
                      </div>
                      <Button type="submit" disabled={saving} size="sm">
                        <Truck className="h-4 w-4 ml-1" />
                        {saving ? "جاري..." : "تسجيل"}
                      </Button>
                    </form>

                    {selectedOrder.fabricReceiving &&
                      selectedOrder.fabricReceiving.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                  التاريخ
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                  النوع
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                  الكمية
                                </th>
                                <th className="px-3 py-2 text-right font-medium text-muted-foreground text-xs">
                                  ملاحظات
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedOrder.fabricReceiving.map((f) => (
                                <tr
                                  key={f.id}
                                  className="border-b last:border-0"
                                >
                                  <td className="px-3 py-2">
                                    {formatDate(f.date)}
                                  </td>
                                  <td className="px-3 py-2">
                                    {f.fabricType || "—"}
                                  </td>
                                  <td className="px-3 py-2">
                                    {f.quantity} {getUnitLabel(f.unit)}
                                  </td>
                                  <td className="px-3 py-2 text-muted-foreground">
                                    {f.notes || "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {selectedOrder.notes && (
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <span className="text-muted-foreground">ملاحظات: </span>
                  {selectedOrder.notes}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف أوردر &quot;{deletingOrder?.client?.name}
              &quot;؟ سيتم حذف جميع بيانات التقدم والقماش المرتبطة نهائياً.
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
