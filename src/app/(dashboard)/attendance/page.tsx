"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Calendar,
  Clock,
  Upload,
  Check,
  Users,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import { StatCard } from "@/components/shared/stat-card";
import {
  cn,
  todayString,
  getAttendanceStatusLabel,
  formatDate,
  getCurrentMonth,
} from "@/lib/utils";
import type { Employee, Attendance } from "@/generated/prisma/client";

type AttendanceWithEmployee = Attendance & { employee: Employee };

type ViewMode = "daily" | "monthly";

interface AttendanceRow {
  employee: Employee;
  record: Attendance | null;
  checkIn: string;
  checkOut: string;
  status: string;
  notes: string;
  dirty: boolean;
}

interface MonthlySummary {
  employee: Employee;
  present: number;
  absent: number;
  late: number;
  leave: number;
  totalDays: number;
  rate: number;
}

const STATUS_OPTIONS = [
  { value: "present", label: "حاضر" },
  { value: "absent", label: "غائب" },
  { value: "late", label: "متأخر" },
  { value: "leave", label: "إجازة" },
];

const STATUS_ROW_COLORS: Record<string, string> = {
  present: "",
  absent: "bg-red-50 dark:bg-red-950/30",
  late: "bg-yellow-50 dark:bg-yellow-950/30",
  leave: "bg-blue-50 dark:bg-blue-950/30",
};

const STATUS_BADGE_VARIANT: Record<
  string,
  "success" | "destructive" | "warning" | "default"
> = {
  present: "success",
  absent: "destructive",
  late: "warning",
  leave: "default",
};

function nowTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function parseCSV(text: string): string[][] {
  const lines = text.trim().split(/\r?\n/);
  return lines.map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
  );
}

export default function AttendancePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<AttendanceRow | null>(null);
  const [editForm, setEditForm] = useState({
    checkIn: "",
    checkOut: "",
    status: "present",
    notes: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees?active=true");
      if (!res.ok) throw new Error();
      return (await res.json()) as Employee[];
    } catch {
      toast.error("فشل في جلب بيانات الموظفين");
      return [];
    }
  }, []);

  const fetchDailyAttendance = useCallback(
    async (date: string, emps: Employee[]) => {
      try {
        const res = await fetch(`/api/attendance?date=${date}`);
        if (!res.ok) throw new Error();
        const records: AttendanceWithEmployee[] = await res.json();

        const recordMap = new Map<string, Attendance>();
        for (const r of records) {
          recordMap.set(r.employeeId, r);
        }

        const builtRows: AttendanceRow[] = emps.map((emp) => {
          const rec = recordMap.get(emp.id) || null;
          return {
            employee: emp,
            record: rec,
            checkIn: rec?.checkIn || "",
            checkOut: rec?.checkOut || "",
            status: rec?.status || "absent",
            notes: rec?.notes || "",
            dirty: false,
          };
        });

        setRows(builtRows);
      } catch {
        toast.error("فشل في جلب سجلات الحضور");
      }
    },
    []
  );

  const fetchMonthlyAttendance = useCallback(
    async (month: string, emps: Employee[]) => {
      try {
        const res = await fetch(`/api/attendance?month=${month}`);
        if (!res.ok) throw new Error();
        const records: AttendanceWithEmployee[] = await res.json();

        const grouped = new Map<
          string,
          { present: number; absent: number; late: number; leave: number }
        >();
        for (const emp of emps) {
          grouped.set(emp.id, { present: 0, absent: 0, late: 0, leave: 0 });
        }

        for (const r of records) {
          const g = grouped.get(r.employeeId);
          if (g && r.status in g) {
            g[r.status as keyof typeof g]++;
          }
        }

        const summaries: MonthlySummary[] = emps.map((emp) => {
          const g = grouped.get(emp.id) || {
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
          };
          const totalDays = g.present + g.absent + g.late + g.leave;
          const workDays = g.present + g.late;
          const rate = totalDays > 0 ? Math.round((workDays / totalDays) * 100) : 0;
          return { employee: emp, ...g, totalDays, rate };
        });

        setMonthlySummaries(summaries);
      } catch {
        toast.error("فشل في جلب البيانات الشهرية");
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const emps = await fetchEmployees();
    setEmployees(emps);

    if (viewMode === "daily") {
      await fetchDailyAttendance(selectedDate, emps);
    } else {
      await fetchMonthlyAttendance(selectedMonth, emps);
    }
    setLoading(false);
  }, [
    viewMode,
    selectedDate,
    selectedMonth,
    fetchEmployees,
    fetchDailyAttendance,
    fetchMonthlyAttendance,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function updateRow(index: number, field: keyof AttendanceRow, value: string) {
    setRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value, dirty: true };
      return updated;
    });
  }

  async function saveRow(row: AttendanceRow) {
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: row.employee.id,
          date: selectedDate,
          checkIn: row.checkIn || null,
          checkOut: row.checkOut || null,
          status: row.status,
          notes: row.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      return false;
    }
  }

  async function handleSaveRow(index: number) {
    const row = rows[index];
    if (!row.dirty) return;

    setSaving(true);
    const ok = await saveRow(row);
    if (ok) {
      toast.success(`تم حفظ حضور ${row.employee.name}`);
      setRows((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], dirty: false };
        return updated;
      });
    } else {
      toast.error(`فشل في حفظ حضور ${row.employee.name}`);
    }
    setSaving(false);
  }

  async function markAllPresent() {
    setSaving(true);
    const time = nowTimeString();
    const promises = rows.map((row) =>
      fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: row.employee.id,
          date: selectedDate,
          checkIn: row.checkIn || time,
          status: "present",
          notes: row.notes || null,
        }),
      })
    );

    try {
      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        toast.success("تم تسجيل حضور الكل بنجاح");
        await fetchDailyAttendance(selectedDate, employees);
      } else {
        toast.error("حدث خطأ في تسجيل بعض السجلات");
      }
    } catch {
      toast.error("حدث خطأ في تسجيل الحضور");
    }
    setSaving(false);
  }

  function openEditDialog(row: AttendanceRow) {
    setEditingRow(row);
    setEditForm({
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      status: row.status,
      notes: row.notes,
    });
    setEditDialogOpen(true);
  }

  async function handleEditSubmit() {
    if (!editingRow) return;

    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: editingRow.employee.id,
          date: selectedDate,
          checkIn: editForm.checkIn || null,
          checkOut: editForm.checkOut || null,
          status: editForm.status,
          notes: editForm.notes || null,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success(`تم حفظ حضور ${editingRow.employee.name}`);
      setEditDialogOpen(false);
      await fetchDailyAttendance(selectedDate, employees);
    } catch {
      toast.error("حدث خطأ في الحفظ");
    }
    setSaving(false);
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = parseCSV(text);

      if (parsed.length < 2) {
        toast.error("الملف فارغ أو لا يحتوي على بيانات كافية");
        return;
      }

      const headers = parsed[0].map((h) => h.toLowerCase());
      const empIdIdx = headers.findIndex((h) =>
        ["employeeid", "employee_id", "رقم الموظف"].includes(h)
      );
      const dateIdx = headers.findIndex((h) =>
        ["date", "التاريخ"].includes(h)
      );
      const checkInIdx = headers.findIndex((h) =>
        ["checkin", "check_in", "الحضور"].includes(h)
      );
      const checkOutIdx = headers.findIndex((h) =>
        ["checkout", "check_out", "الانصراف"].includes(h)
      );
      const statusIdx = headers.findIndex((h) =>
        ["status", "الحالة"].includes(h)
      );

      if (empIdIdx === -1 || dateIdx === -1) {
        toast.error(
          "الملف يجب أن يحتوي على أعمدة employeeId و date على الأقل"
        );
        return;
      }

      const records = parsed.slice(1).filter((row) => row[empIdIdx] && row[dateIdx]).map((row) => ({
        employeeId: row[empIdIdx],
        date: row[dateIdx],
        checkIn: checkInIdx >= 0 ? row[checkInIdx] : undefined,
        checkOut: checkOutIdx >= 0 ? row[checkOutIdx] : undefined,
        status: statusIdx >= 0 ? row[statusIdx] : undefined,
      }));

      if (records.length === 0) {
        toast.error("لا توجد سجلات صالحة في الملف");
        return;
      }

      setSaving(true);
      const res = await fetch("/api/attendance/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(records),
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      toast.success(result.message);
      setImportDialogOpen(false);
      loadData();
    } catch {
      toast.error("حدث خطأ في استيراد الملف");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const dailyStats = {
    total: rows.length,
    present: rows.filter((r) => r.status === "present").length,
    absent: rows.filter((r) => r.status === "absent").length,
    late: rows.filter((r) => r.status === "late").length,
    leave: rows.filter((r) => r.status === "leave").length,
  };

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
        title="سجل الحضور والانصراف"
        description="تسجيل ومتابعة حضور وانصراف الموظفين"
        action={{
          label: "استيراد من ملف",
          icon: Upload,
          onClick: () => setImportDialogOpen(true),
        }}
      />

      {/* Controls Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 rounded-lg border p-1">
              <Button
                variant={viewMode === "daily" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("daily")}
                className="gap-1.5"
              >
                <Calendar className="h-4 w-4" />
                يومي
              </Button>
              <Button
                variant={viewMode === "monthly" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("monthly")}
                className="gap-1.5"
              >
                <BarChart3 className="h-4 w-4" />
                شهري
              </Button>
            </div>

            {viewMode === "daily" ? (
              <div className="flex items-center gap-2">
                <Label htmlFor="date-picker" className="whitespace-nowrap">
                  التاريخ:
                </Label>
                <Input
                  id="date-picker"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-44"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Label htmlFor="month-picker" className="whitespace-nowrap">
                  الشهر:
                </Label>
                <Input
                  id="month-picker"
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-44"
                />
              </div>
            )}

            {viewMode === "daily" && (
              <Button
                onClick={markAllPresent}
                disabled={saving}
                variant="outline"
                className="gap-1.5 mr-auto"
              >
                <Check className="h-4 w-4" />
                تسجيل حضور الكل
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily View */}
      {viewMode === "daily" && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              title="إجمالي الموظفين"
              value={dailyStats.total}
              icon={Users}
            />
            <StatCard
              title="حاضر"
              value={dailyStats.present}
              icon={Check}
              iconClassName="bg-green-500"
            />
            <StatCard
              title="غائب"
              value={dailyStats.absent}
              icon={Users}
              iconClassName="bg-red-500"
            />
            <StatCard
              title="متأخر"
              value={dailyStats.late}
              icon={Clock}
              iconClassName="bg-yellow-500"
            />
            <StatCard
              title="إجازة"
              value={dailyStats.leave}
              icon={Calendar}
              iconClassName="bg-blue-500"
            />
          </div>

          {/* Daily Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                حضور يوم {formatDate(selectedDate)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        الموظف
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        الحضور
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        الانصراف
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        الحالة
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                        ملاحظات
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-muted-foreground w-24">
                        إجراءات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          لا يوجد موظفين نشطين
                        </td>
                      </tr>
                    ) : (
                      rows.map((row, i) => (
                        <tr
                          key={row.employee.id}
                          className={cn(
                            "border-b last:border-0 transition-colors",
                            STATUS_ROW_COLORS[row.status] || ""
                          )}
                        >
                          <td className="px-4 py-3 font-medium">
                            {row.employee.name}
                            <span className="block text-xs text-muted-foreground">
                              {row.employee.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="time"
                              value={row.checkIn}
                              onChange={(e) =>
                                updateRow(i, "checkIn", e.target.value)
                              }
                              className="w-28 h-8 text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="time"
                              value={row.checkOut}
                              onChange={(e) =>
                                updateRow(i, "checkOut", e.target.value)
                              }
                              className="w-28 h-8 text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Select
                              value={row.status}
                              onChange={(e) =>
                                updateRow(i, "status", e.target.value)
                              }
                              className="w-28 h-8 text-xs"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={row.notes}
                              onChange={(e) =>
                                updateRow(i, "notes", e.target.value)
                              }
                              placeholder="ملاحظات..."
                              className="w-36 h-8 text-xs"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {row.dirty && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaveRow(i)}
                                  disabled={saving}
                                  className="h-7 text-xs gap-1"
                                >
                                  <Check className="h-3 w-3" />
                                  حفظ
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openEditDialog(row)}
                                className="h-7 text-xs"
                              >
                                تعديل
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

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-950/30 border" />
              غائب
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-yellow-100 dark:bg-yellow-950/30 border" />
              متأخر
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-100 dark:bg-blue-950/30 border" />
              إجازة
            </span>
          </div>
        </>
      )}

      {/* Monthly View */}
      {viewMode === "monthly" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              ملخص شهر {selectedMonth}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      الموظف
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      أيام الحضور
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      أيام الغياب
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      أيام التأخير
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      إجازات
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                      نسبة الحضور
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummaries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        لا توجد بيانات لهذا الشهر
                      </td>
                    </tr>
                  ) : (
                    monthlySummaries.map((s) => (
                      <tr
                        key={s.employee.id}
                        className="border-b last:border-0 transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {s.employee.name}
                          <span className="block text-xs text-muted-foreground">
                            {s.employee.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="success">{s.present}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={s.absent > 0 ? "destructive" : "secondary"}>
                            {s.absent}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={s.late > 0 ? "warning" : "secondary"}>
                            {s.late}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="default">{s.leave}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              "font-semibold",
                              s.rate >= 90
                                ? "text-green-600"
                                : s.rate >= 70
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            )}
                          >
                            {s.rate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              تعديل حضور {editingRow?.employee.name}
            </DialogTitle>
            <DialogDescription>
              تعديل بيانات الحضور ليوم {formatDate(selectedDate)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-checkin">وقت الحضور</Label>
              <Input
                id="edit-checkin"
                type="time"
                value={editForm.checkIn}
                onChange={(e) =>
                  setEditForm({ ...editForm, checkIn: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-checkout">وقت الانصراف</Label>
              <Input
                id="edit-checkout"
                type="time"
                value={editForm.checkOut}
                onChange={(e) =>
                  setEditForm({ ...editForm, checkOut: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">الحالة</Label>
              <Select
                id="edit-status"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-notes">ملاحظات</Label>
              <Input
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                placeholder="ملاحظات..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button onClick={handleEditSubmit} disabled={saving}>
              {saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>استيراد بيانات الحضور</DialogTitle>
            <DialogDescription>
              قم برفع ملف CSV يحتوي على بيانات الحضور. يجب أن يحتوي الملف على
              أعمدة employeeId و date على الأقل.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                اختر ملف CSV أو Excel
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileImport}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
              >
                {saving ? "جاري الاستيراد..." : "اختيار ملف"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">الأعمدة المطلوبة:</p>
              <p>employeeId, date, checkIn, checkOut, status</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
