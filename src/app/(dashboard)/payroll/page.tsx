"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calculator,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Gift,
  Minus,
  Printer,
  Users,
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
import { StatCard } from "@/components/shared/stat-card";
import { formatCurrency, formatNumber, getCurrentMonth, cn } from "@/lib/utils";
import type { Employee, Deduction } from "@/generated/prisma/client";

interface PayrollRecordWithRelations {
  id: string;
  employeeId: string;
  period: string;
  periodType: string;
  baseSalary: number;
  attendanceBonus: number;
  productionBonus: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee: Employee;
  deductions: Deduction[];
}

interface AttendanceSummary {
  present: number;
  absent: number;
  late: number;
  leave: number;
}

interface ProductionSummary {
  totalPieces: number;
  avgPerDay: number;
  daysWorked: number;
}

interface DeductionForm {
  employeeId: string;
  type: string;
  amount: string;
  reason: string;
  date: string;
}

const emptyDeductionForm: DeductionForm = {
  employeeId: "",
  type: "other",
  amount: "",
  reason: "",
  date: new Date().toISOString().split("T")[0],
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  approved: "معتمد",
  paid: "مدفوع",
};

const statusVariants: Record<string, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  draft: "secondary",
  approved: "default",
  paid: "success",
};

const deductionTypeLabels: Record<string, string> = {
  absence: "غياب",
  late: "تأخير",
  advance: "سلفة",
  other: "أخرى",
};

export default function PayrollPage() {
  const [period, setPeriod] = useState(getCurrentMonth());
  const [records, setRecords] = useState<PayrollRecordWithRelations[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [detailRecord, setDetailRecord] =
    useState<PayrollRecordWithRelations | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);
  const [productionSummary, setProductionSummary] =
    useState<ProductionSummary | null>(null);

  const [deductionDialogOpen, setDeductionDialogOpen] = useState(false);
  const [deductionForm, setDeductionForm] =
    useState<DeductionForm>(emptyDeductionForm);

  const fetchRecords = useCallback(async () => {
    try {
      const res = await fetch(`/api/payroll?period=${period}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRecords(data);
    } catch {
      toast.error("فشل في جلب بيانات المرتبات");
    } finally {
      setLoading(false);
    }
  }, [period]);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?active=true");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(data);
    } catch {
      console.error("Failed to fetch employees");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  async function calculatePayroll() {
    setCalculating(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, periodType: "monthly" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }
      const data = await res.json();
      setRecords(data);
      toast.success(`تم حساب مرتبات ${data.length} موظف`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ في حساب المرتبات");
    } finally {
      setCalculating(false);
    }
  }

  async function fetchEmployeeDetails(record: PayrollRecordWithRelations) {
    setDetailRecord(record);
    setDetailOpen(true);
    try {
      const { start, end } = getMonthRange(record.period);
      const [attRes, prodRes] = await Promise.all([
        fetch(
          `/api/attendance?employeeId=${record.employeeId}&from=${start}&to=${end}`
        ),
        fetch(
          `/api/production?employeeId=${record.employeeId}&from=${start}&to=${end}`
        ),
      ]);

      if (attRes.ok) {
        const attData = await attRes.json();
        const rows = Array.isArray(attData) ? attData : [];
        setAttendanceSummary({
          present: rows.filter(
            (a: { status: string }) => a.status === "present"
          ).length,
          absent: rows.filter(
            (a: { status: string }) => a.status === "absent"
          ).length,
          late: rows.filter((a: { status: string }) => a.status === "late")
            .length,
          leave: rows.filter((a: { status: string }) => a.status === "leave")
            .length,
        });
      } else {
        setAttendanceSummary(null);
      }

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const rows = Array.isArray(prodData) ? prodData : [];
        const totalPieces = rows.reduce(
          (s: number, p: { quantity: number }) => s + p.quantity,
          0
        );
        const daysWorked = new Set(rows.map((p: { date: string }) => p.date))
          .size;
        setProductionSummary({
          totalPieces,
          avgPerDay: daysWorked > 0 ? Math.round(totalPieces / daysWorked) : 0,
          daysWorked,
        });
      } else {
        setProductionSummary(null);
      }
    } catch {
      setAttendanceSummary(null);
      setProductionSummary(null);
    }
  }

  async function bulkUpdateStatus(newStatus: string) {
    setSaving(true);
    try {
      const targetRecords = records.filter((r) => {
        if (newStatus === "approved") return r.status === "draft";
        if (newStatus === "paid") return r.status === "approved";
        return false;
      });

      if (targetRecords.length === 0) {
        toast.info("لا توجد سجلات للتحديث");
        setSaving(false);
        return;
      }

      await Promise.all(
        targetRecords.map((r) =>
          fetch(`/api/payroll/${r.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );

      toast.success(
        `تم تحديث ${targetRecords.length} سجل إلى ${statusLabels[newStatus]}`
      );
      fetchRecords();
    } catch {
      toast.error("حدث خطأ في تحديث الحالة");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddDeduction(e: React.FormEvent) {
    e.preventDefault();
    if (
      !deductionForm.employeeId ||
      !deductionForm.amount ||
      !deductionForm.date
    ) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/deductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: deductionForm.employeeId,
          type: deductionForm.type,
          amount: Number(deductionForm.amount),
          reason: deductionForm.reason || null,
          date: deductionForm.date,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "حدث خطأ");
      }

      toast.success("تم إضافة الخصم بنجاح");
      setDeductionDialogOpen(false);
      setDeductionForm(emptyDeductionForm);
      fetchRecords();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  function getMonthRange(p: string): { start: string; end: string } {
    const [year, month] = p.split("-").map(Number);
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { start, end };
  }

  const totalSalaries = records.reduce((s, r) => s + r.netSalary, 0);
  const totalBonuses = records.reduce(
    (s, r) => s + r.attendanceBonus + r.productionBonus,
    0
  );
  const totalDeductions = records.reduce((s, r) => s + r.totalDeductions, 0);

  function getRowClassName(status: string): string {
    if (status === "paid")
      return "bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30";
    if (status === "approved")
      return "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30";
    return "hover:bg-muted/50";
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
        title="المرتبات"
        description="إدارة وحساب مرتبات الموظفين"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="period">الشهر:</Label>
          <Input
            id="period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-44"
          />
        </div>

        <Button
          onClick={calculatePayroll}
          disabled={calculating}
          className="gap-2"
        >
          <Calculator className="h-4 w-4" />
          {calculating ? "جاري الحساب..." : "حساب المرتبات"}
        </Button>

        <Button
          variant="outline"
          onClick={() => bulkUpdateStatus("approved")}
          disabled={saving}
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          اعتماد الكل
        </Button>

        <Button
          variant="outline"
          onClick={() => bulkUpdateStatus("paid")}
          disabled={saving}
          className="gap-2"
        >
          <CreditCard className="h-4 w-4" />
          تحويل الكل
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            setDeductionForm(emptyDeductionForm);
            setDeductionDialogOpen(true);
          }}
          className="gap-2"
        >
          <Minus className="h-4 w-4" />
          إضافة خصم
        </Button>

        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2 print:hidden"
        >
          <Printer className="h-4 w-4" />
          طباعة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي المرتبات"
          value={formatCurrency(totalSalaries)}
          icon={DollarSign}
          iconClassName="bg-emerald-500"
        />
        <StatCard
          title="عدد الموظفين"
          value={formatNumber(records.length)}
          icon={Users}
          iconClassName="bg-blue-500"
        />
        <StatCard
          title="إجمالي البونص"
          value={formatCurrency(totalBonuses)}
          icon={Gift}
          iconClassName="bg-amber-500"
        />
        <StatCard
          title="إجمالي الخصومات"
          value={formatCurrency(totalDeductions)}
          icon={Minus}
          iconClassName="bg-red-500"
        />
      </div>

      {/* Payroll Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  الموظف
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  المرتب الأساسي
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  بونص انتظام
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  بونص انتاج
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  الخصومات
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  صافي المرتب
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-muted-foreground"
                  >
                    لا توجد سجلات مرتبات لهذه الفترة. اضغط &quot;حساب
                    المرتبات&quot; لحساب المرتبات.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={record.id}
                    className={cn(
                      "border-b last:border-0 transition-colors cursor-pointer",
                      getRowClassName(record.status)
                    )}
                    onClick={() => fetchEmployeeDetails(record)}
                  >
                    <td className="px-4 py-3 font-medium">
                      {record.employee.name}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(record.baseSalary)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(record.attendanceBonus)}
                    </td>
                    <td className="px-4 py-3">
                      {formatCurrency(record.productionBonus)}
                    </td>
                    <td className="px-4 py-3 text-red-600">
                      {record.totalDeductions > 0
                        ? `-${formatCurrency(record.totalDeductions)}`
                        : formatCurrency(0)}
                    </td>
                    <td className="px-4 py-3 font-bold">
                      {formatCurrency(record.netSalary)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariants[record.status]}>
                        {statusLabels[record.status]}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {records.length > 0 && (
              <tfoot>
                <tr className="border-t-2 bg-muted/30 font-bold">
                  <td className="px-4 py-3">الإجمالي</td>
                  <td className="px-4 py-3">
                    {formatCurrency(
                      records.reduce((s, r) => s + r.baseSalary, 0)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(
                      records.reduce((s, r) => s + r.attendanceBonus, 0)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(
                      records.reduce((s, r) => s + r.productionBonus, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-red-600">
                    {totalDeductions > 0
                      ? `-${formatCurrency(totalDeductions)}`
                      : formatCurrency(0)}
                  </td>
                  <td className="px-4 py-3">
                    {formatCurrency(totalSalaries)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              تفاصيل مرتب - {detailRecord?.employee.name}
            </DialogTitle>
            <DialogDescription>
              تفاصيل حساب المرتب للفترة {detailRecord?.period}
            </DialogDescription>
          </DialogHeader>

          {detailRecord && (
            <div className="space-y-6">
              {/* Attendance Summary */}
              <div>
                <h4 className="font-semibold mb-2">ملخص الحضور</h4>
                {attendanceSummary ? (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3 text-center">
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        {attendanceSummary.present}
                      </p>
                      <p className="text-xs text-muted-foreground">حاضر</p>
                    </div>
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-center">
                      <p className="text-lg font-bold text-red-700 dark:text-red-400">
                        {attendanceSummary.absent}
                      </p>
                      <p className="text-xs text-muted-foreground">غائب</p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950/30 p-3 text-center">
                      <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                        {attendanceSummary.late}
                      </p>
                      <p className="text-xs text-muted-foreground">متأخر</p>
                    </div>
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 text-center">
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {attendanceSummary.leave}
                      </p>
                      <p className="text-xs text-muted-foreground">إجازة</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    لا توجد بيانات حضور
                  </p>
                )}
              </div>

              {/* Production Summary */}
              <div>
                <h4 className="font-semibold mb-2">ملخص الإنتاج</h4>
                {productionSummary && productionSummary.totalPieces > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {formatNumber(productionSummary.totalPieces)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        إجمالي القطع
                      </p>
                    </div>
                    <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {formatNumber(productionSummary.avgPerDay)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        متوسط/يوم
                      </p>
                    </div>
                    <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 p-3 text-center">
                      <p className="text-lg font-bold text-purple-700 dark:text-purple-400">
                        {productionSummary.daysWorked}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        أيام العمل
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    لا توجد بيانات إنتاج
                  </p>
                )}
              </div>

              {/* Deductions List */}
              <div>
                <h4 className="font-semibold mb-2">الخصومات</h4>
                {detailRecord.deductions.length > 0 ? (
                  <div className="space-y-2">
                    {detailRecord.deductions.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <Badge variant="outline">
                            {deductionTypeLabels[d.type] || d.type}
                          </Badge>
                          {d.reason && (
                            <span className="text-sm text-muted-foreground mr-2">
                              {d.reason}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(d.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    لا توجد خصومات
                  </p>
                )}
              </div>

              {/* Salary Breakdown */}
              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="font-semibold mb-3">تفصيل المرتب</h4>
                <div className="flex justify-between text-sm">
                  <span>المرتب الأساسي</span>
                  <span>{formatCurrency(detailRecord.baseSalary)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>+ بونص انتظام</span>
                  <span>{formatCurrency(detailRecord.attendanceBonus)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>+ بونص إنتاج</span>
                  <span>{formatCurrency(detailRecord.productionBonus)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>- الخصومات</span>
                  <span>{formatCurrency(detailRecord.totalDeductions)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-base">
                  <span>صافي المرتب</span>
                  <span>{formatCurrency(detailRecord.netSalary)}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Deduction Dialog */}
      <Dialog open={deductionDialogOpen} onOpenChange={setDeductionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة خصم</DialogTitle>
            <DialogDescription>
              أدخل بيانات الخصم الجديد
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDeduction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deduction-employee">الموظف *</Label>
              <Select
                id="deduction-employee"
                value={deductionForm.employeeId}
                onChange={(e) =>
                  setDeductionForm({
                    ...deductionForm,
                    employeeId: e.target.value,
                  })
                }
                required
              >
                <option value="">اختر الموظف</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deduction-type">نوع الخصم</Label>
                <Select
                  id="deduction-type"
                  value={deductionForm.type}
                  onChange={(e) =>
                    setDeductionForm({
                      ...deductionForm,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="absence">غياب</option>
                  <option value="late">تأخير</option>
                  <option value="advance">سلفة</option>
                  <option value="other">أخرى</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deduction-amount">المبلغ *</Label>
                <Input
                  id="deduction-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={deductionForm.amount}
                  onChange={(e) =>
                    setDeductionForm({
                      ...deductionForm,
                      amount: e.target.value,
                    })
                  }
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduction-date">التاريخ *</Label>
              <Input
                id="deduction-date"
                type="date"
                value={deductionForm.date}
                onChange={(e) =>
                  setDeductionForm({
                    ...deductionForm,
                    date: e.target.value,
                  })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deduction-reason">السبب</Label>
              <Input
                id="deduction-reason"
                value={deductionForm.reason}
                onChange={(e) =>
                  setDeductionForm({
                    ...deductionForm,
                    reason: e.target.value,
                  })
                }
                placeholder="سبب الخصم (اختياري)"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeductionDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "جاري الحفظ..." : "إضافة الخصم"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
