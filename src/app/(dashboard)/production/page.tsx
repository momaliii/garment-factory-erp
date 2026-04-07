"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Factory,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  Users,
  Calendar,
  Trophy,
  Medal,
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
import { formatNumber, todayString, getCurrentMonth } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  role: string;
}

interface Order {
  id: string;
  description: string | null;
  type: string;
  client: { name: string };
}

interface ProductionRecord {
  id: string;
  employeeId: string;
  orderId: string | null;
  date: string;
  quantity: number;
  notes: string | null;
  employee: { id: string; name: string; role: string };
  order: { id: string; description: string | null; type: string; client: { name: string } } | null;
}

interface SummaryEmployee {
  id: string;
  name: string;
  role: string;
  totalQuantity: number;
  daysWorked: number;
  avgPerDay: number;
}

interface SummaryData {
  month: string;
  totalFactory: number;
  employeeCount: number;
  topProducer: SummaryEmployee | null;
  employees: SummaryEmployee[];
}

interface ProductionForm {
  employeeId: string;
  orderId: string;
  quantity: string;
  notes: string;
}

const emptyForm: ProductionForm = {
  employeeId: "",
  orderId: "",
  quantity: "",
  notes: "",
};

export default function ProductionPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "summary">("daily");
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingRecord, setDeletingRecord] = useState<ProductionRecord | null>(null);

  const [form, setForm] = useState<ProductionForm>(emptyForm);
  const [quickForm, setQuickForm] = useState<ProductionForm>(emptyForm);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`/api/production?date=${selectedDate}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecords(data);
    } catch {
      toast.error("فشل في جلب بيانات الإنتاج");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch(`/api/production/summary?month=${selectedMonth}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSummary(data);
    } catch {
      toast.error("فشل في جلب ملخص الإنتاج");
    }
  }, [selectedMonth]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data.filter((e: Employee & { isActive: boolean }) => e.isActive));
    } catch {
      toast.error("فشل في جلب بيانات الموظفين");
    }
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOrders(data);
    } catch {
      toast.error("فشل في جلب بيانات الأوردرات");
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchOrders();
  }, [fetchEmployees, fetchOrders]);

  useEffect(() => {
    if (activeTab === "daily") {
      setLoading(true);
      fetchRecords();
    }
  }, [activeTab, fetchRecords]);

  useEffect(() => {
    if (activeTab === "summary") {
      fetchSummary();
    }
  }, [activeTab, fetchSummary]);

  const dailyTotal = records.reduce((sum, r) => sum + r.quantity, 0);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quickForm.employeeId || !quickForm.quantity) {
      toast.error("يرجى اختيار الموظف وإدخال الكمية");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: quickForm.employeeId,
          orderId: quickForm.orderId || null,
          date: selectedDate,
          quantity: parseInt(quickForm.quantity),
          notes: quickForm.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success("تم إضافة سجل الإنتاج بنجاح");
      setQuickForm(emptyForm);
      fetchRecords();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  function openEditDialog(record: ProductionRecord) {
    setEditingId(record.id);
    setForm({
      employeeId: record.employeeId,
      orderId: record.orderId || "",
      quantity: String(record.quantity),
      notes: record.notes || "",
    });
    setEditDialogOpen(true);
  }

  function openDeleteDialog(record: ProductionRecord) {
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !form.employeeId || !form.quantity) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/production", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          employeeId: form.employeeId,
          orderId: form.orderId || null,
          date: selectedDate,
          quantity: parseInt(form.quantity),
          notes: form.notes || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success("تم تعديل السجل بنجاح");
      setEditDialogOpen(false);
      fetchRecords();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingRecord) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/production?id=${deletingRecord.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("تم حذف السجل بنجاح");
      setDeleteDialogOpen(false);
      setDeletingRecord(null);
      fetchRecords();
    } catch {
      toast.error("فشل في حذف السجل");
    } finally {
      setSaving(false);
    }
  }

  function getRankBadge(index: number) {
    if (index === 0)
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 gap-1">
          <Trophy className="h-3 w-3" /> الأول
        </Badge>
      );
    if (index === 1)
      return (
        <Badge className="bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 gap-1">
          <Medal className="h-3 w-3" /> الثاني
        </Badge>
      );
    if (index === 2)
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 gap-1">
          <Medal className="h-3 w-3" /> الثالث
        </Badge>
      );
    return null;
  }

  if (loading && activeTab === "daily") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="تتبع الإنتاج"
        description="متابعة الإنتاج اليومي وأداء الموظفين"
        action={{
          label: activeTab === "daily" ? "إضافة سجل" : "عرض اليومي",
          icon: activeTab === "daily" ? Plus : Calendar,
          onClick: () =>
            setActiveTab(activeTab === "daily" ? "summary" : "daily"),
        }}
      />

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "daily" ? "default" : "outline"}
          onClick={() => setActiveTab("daily")}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          الإنتاج اليومي
        </Button>
        <Button
          variant={activeTab === "summary" ? "default" : "outline"}
          onClick={() => setActiveTab("summary")}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          الملخص الشهري
        </Button>
      </div>

      {activeTab === "daily" ? (
        <>
          {/* Date Selector & Daily Total */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="dateSelector">التاريخ</Label>
              <Input
                id="dateSelector"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <StatCard
              title="إجمالي إنتاج اليوم"
              value={formatNumber(dailyTotal)}
              subtitle={`${formatNumber(records.length)} سجل`}
              icon={Factory}
              iconClassName="bg-blue-600"
            />
            <StatCard
              title="عدد العاملين اليوم"
              value={formatNumber(new Set(records.map((r) => r.employeeId)).size)}
              subtitle="موظف"
              icon={Users}
              iconClassName="bg-green-600"
            />
            <StatCard
              title="متوسط الإنتاج"
              value={
                records.length > 0
                  ? formatNumber(
                      Math.round(
                        dailyTotal /
                          new Set(records.map((r) => r.employeeId)).size
                      )
                    )
                  : "0"
              }
              subtitle="قطعة / موظف"
              icon={TrendingUp}
              iconClassName="bg-purple-600"
            />
          </div>

          {/* Quick Add Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة سجل إنتاج
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleQuickAdd}
                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
              >
                <div className="space-y-2">
                  <Label htmlFor="qEmployee">الموظف *</Label>
                  <Select
                    id="qEmployee"
                    value={quickForm.employeeId}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, employeeId: e.target.value })
                    }
                  >
                    <option value="">اختر الموظف</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.role}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qOrder">الأوردر</Label>
                  <Select
                    id="qOrder"
                    value={quickForm.orderId}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, orderId: e.target.value })
                    }
                  >
                    <option value="">بدون أوردر</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.client?.name || ""} -{" "}
                        {order.description || order.type}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qQuantity">عدد القطع *</Label>
                  <Input
                    id="qQuantity"
                    type="number"
                    min="1"
                    value={quickForm.quantity}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, quantity: e.target.value })
                    }
                    placeholder="الكمية"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qNotes">ملاحظات</Label>
                  <Input
                    id="qNotes"
                    value={quickForm.notes}
                    onChange={(e) =>
                      setQuickForm({ ...quickForm, notes: e.target.value })
                    }
                    placeholder="ملاحظات..."
                  />
                </div>

                <Button type="submit" disabled={saving} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {saving ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Production Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        الموظف
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        الأوردر
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        عدد القطع
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        ملاحظات
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          لا توجد سجلات إنتاج لهذا اليوم
                        </td>
                      </tr>
                    ) : (
                      records.map((record) => (
                        <tr
                          key={record.id}
                          className="border-b last:border-0 transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {record.employee.name}
                            <span className="text-xs text-muted-foreground mr-2">
                              ({record.employee.role})
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {record.order ? (
                              <span>
                                {record.order.client?.name} -{" "}
                                {record.order.description || record.order.type}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="font-bold">
                              {formatNumber(record.quantity)} قطعة
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {record.notes || "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(record)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(record)}
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
        </>
      ) : (
        <>
          {/* Monthly Summary */}
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <Label htmlFor="monthSelector">الشهر</Label>
              <Input
                id="monthSelector"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          {summary && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                  title="إجمالي إنتاج الشهر"
                  value={formatNumber(summary.totalFactory)}
                  subtitle="قطعة"
                  icon={Factory}
                  iconClassName="bg-blue-600"
                />
                <StatCard
                  title="عدد العاملين"
                  value={formatNumber(summary.employeeCount)}
                  subtitle="موظف"
                  icon={Users}
                  iconClassName="bg-green-600"
                />
                <StatCard
                  title="أفضل منتج"
                  value={summary.topProducer?.name || "—"}
                  subtitle={
                    summary.topProducer
                      ? `${formatNumber(summary.topProducer.totalQuantity)} قطعة`
                      : ""
                  }
                  icon={Trophy}
                  iconClassName="bg-yellow-600"
                />
                <StatCard
                  title="متوسط الإنتاج اليومي"
                  value={
                    summary.employeeCount > 0
                      ? formatNumber(
                          Math.round(
                            summary.totalFactory / summary.employeeCount
                          )
                        )
                      : "0"
                  }
                  subtitle="قطعة / موظف"
                  icon={TrendingUp}
                  iconClassName="bg-purple-600"
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    أداء الموظفين - {selectedMonth}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            #
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            الموظف
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            إجمالي القطع
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            أيام العمل
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            متوسط يومي
                          </th>
                          <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            الترتيب
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.employees.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-12 text-center text-muted-foreground"
                            >
                              لا توجد بيانات إنتاج لهذا الشهر
                            </td>
                          </tr>
                        ) : (
                          summary.employees.map((emp, index) => (
                            <tr
                              key={emp.id}
                              className={`border-b last:border-0 transition-colors hover:bg-muted/50 ${
                                index < 3 ? "bg-muted/30" : ""
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-muted-foreground">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {emp.name}
                                <span className="text-xs text-muted-foreground mr-2">
                                  ({emp.role})
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-primary">
                                  {formatNumber(emp.totalQuantity)}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {formatNumber(emp.daysWorked)} يوم
                              </td>
                              <td className="px-4 py-3">
                                {formatNumber(emp.avgPerDay)} قطعة
                              </td>
                              <td className="px-4 py-3">
                                {getRankBadge(index)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل سجل الإنتاج</DialogTitle>
            <DialogDescription>
              قم بتعديل بيانات السجل ثم اضغط حفظ
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editEmployee">الموظف *</Label>
              <Select
                id="editEmployee"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
              >
                <option value="">اختر الموظف</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editOrder">الأوردر</Label>
              <Select
                id="editOrder"
                value={form.orderId}
                onChange={(e) =>
                  setForm({ ...form, orderId: e.target.value })
                }
              >
                <option value="">بدون أوردر</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.client?.name || ""} -{" "}
                    {order.description || order.type}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editQuantity">عدد القطع *</Label>
              <Input
                id="editQuantity"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) =>
                  setForm({ ...form, quantity: e.target.value })
                }
                placeholder="الكمية"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">ملاحظات</Label>
              <Textarea
                id="editNotes"
                value={form.notes}
                onChange={(e) =>
                  setForm({ ...form, notes: e.target.value })
                }
                placeholder="ملاحظات..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
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
              هل أنت متأكد من حذف سجل إنتاج &quot;
              {deletingRecord?.employee.name}&quot; ({deletingRecord?.quantity}{" "}
              قطعة)؟
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
