"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Factory, Calendar, Award, TrendingDown, User } from "lucide-react";

interface MyData {
  employee: { name: string; role: string; baseSalary: number } | null;
  production: { date: string; quantity: number; notes: string | null }[];
  monthlyTotal: number;
  attendance: { date: string; checkIn: string | null; checkOut: string | null; status: string }[];
  presentDays: number;
  latestPayroll: { period: string; baseSalary: number; attendanceBonus: number; productionBonus: number; totalDeductions: number; netSalary: number } | null;
  rank: number;
  totalEmployees: number;
}

function formatCurrency(v: number) { return v.toLocaleString("ar-EG", { minimumFractionDigits: 0 }); }

const STATUS_MAP: Record<string, string> = { present: "حاضر", absent: "غائب", late: "متأخر", leave: "إجازة" };

export default function MyPortalPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(true);

  const employeeId = (session?.user as { employeeId?: string } | undefined)?.employeeId;

  useEffect(() => {
    if (!employeeId) { setLoading(false); return; }
    async function load() {
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const [prodRes, attRes, payRes, empRes] = await Promise.all([
          fetch(`/api/production?employeeId=${employeeId}`),
          fetch(`/api/attendance?employeeId=${employeeId}`),
          fetch(`/api/payroll?employeeId=${employeeId}`),
          fetch(`/api/employees`),
        ]);

        let production: MyData["production"] = [];
        let attendance: MyData["attendance"] = [];
        let latestPayroll: MyData["latestPayroll"] = null;
        let employee: MyData["employee"] = null;
        let rank = 0;
        let totalEmployees = 0;

        if (prodRes.ok) {
          const p = await prodRes.json();
          production = Array.isArray(p) ? p : p.data || [];
        }
        if (attRes.ok) {
          const a = await attRes.json();
          attendance = Array.isArray(a) ? a : a.data || [];
        }
        if (payRes.ok) {
          const pay = await payRes.json();
          const records = Array.isArray(pay) ? pay : pay.data || [];
          latestPayroll = records.length > 0 ? records[0] : null;
        }
        if (empRes.ok) {
          const emps = await empRes.json();
          const allEmps = Array.isArray(emps) ? emps : emps.data || [];
          totalEmployees = allEmps.length;
          const me = allEmps.find((e: { id: string }) => e.id === employeeId);
          if (me) employee = { name: me.name, role: me.role, baseSalary: me.baseSalary };
        }

        const monthProd = production.filter((p) => p.date.startsWith(currentMonth));
        const monthlyTotal = monthProd.reduce((s, p) => s + p.quantity, 0);

        const prodSummaryRes = await fetch("/api/production/summary");
        if (prodSummaryRes.ok) {
          const summary = await prodSummaryRes.json();
          const rankings = Array.isArray(summary) ? summary : summary.data || [];
          const myRank = rankings.findIndex((r: { employeeId: string }) => r.employeeId === employeeId);
          rank = myRank >= 0 ? myRank + 1 : 0;
        }

        setData({
          employee,
          production: monthProd.slice(0, 30),
          monthlyTotal,
          attendance: attendance.slice(0, 30),
          presentDays: attendance.filter((a) => a.status === "present").length,
          latestPayroll,
          rank,
          totalEmployees,
        });
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [employeeId]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  if (!employeeId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <User className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground">حسابك غير مرتبط بموظف. تواصل مع الإدارة.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">بياناتي</h1>
        {data.employee && <p className="text-muted-foreground text-sm">{data.employee.name} — {data.employee.role}</p>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Factory} label="إنتاج الشهر" value={String(data.monthlyTotal)} sub="قطعة" color="green" />
        <StatCard icon={Calendar} label="أيام الحضور" value={String(data.presentDays)} sub="هذا الشهر" color="blue" />
        <StatCard icon={Award} label="الترتيب" value={data.rank > 0 ? `#${data.rank}` : "—"} sub={`من ${data.totalEmployees}`} color="purple" />
        <StatCard icon={TrendingDown} label="صافي المرتب" value={data.latestPayroll ? formatCurrency(data.latestPayroll.netSalary) : "—"} sub={data.latestPayroll?.period || ""} color="amber" />
      </div>

      {/* Latest Payroll */}
      {data.latestPayroll && (
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-3">آخر كشف مرتب — {data.latestPayroll.period}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">الأساسي</p><p className="font-semibold">{formatCurrency(data.latestPayroll.baseSalary)}</p></div>
            <div><p className="text-xs text-muted-foreground">بونص انتظام</p><p className="font-semibold text-green-600">{formatCurrency(data.latestPayroll.attendanceBonus)}</p></div>
            <div><p className="text-xs text-muted-foreground">بونص إنتاج</p><p className="font-semibold text-green-600">{formatCurrency(data.latestPayroll.productionBonus)}</p></div>
            <div><p className="text-xs text-muted-foreground">خصومات</p><p className="font-semibold text-red-600">{formatCurrency(data.latestPayroll.totalDeductions)}</p></div>
            <div><p className="text-xs text-muted-foreground">الصافي</p><p className="font-bold text-lg">{formatCurrency(data.latestPayroll.netSalary)}</p></div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-3">إنتاجي هذا الشهر</h2>
          {data.production.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b"><th className="text-right py-2 pr-2">التاريخ</th><th className="text-right py-2">الكمية</th><th className="text-right py-2">ملاحظات</th></tr></thead>
                <tbody>{data.production.map((p, i) => (
                  <tr key={i} className="border-b last:border-0"><td className="py-2 pr-2">{p.date}</td><td className="py-2 font-medium">{p.quantity}</td><td className="py-2 text-muted-foreground">{p.notes || "—"}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attendance */}
        <div className="bg-card border rounded-xl p-5">
          <h2 className="font-semibold mb-3">سجل الحضور</h2>
          {data.attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-muted-foreground border-b"><th className="text-right py-2 pr-2">التاريخ</th><th className="text-right py-2">الحضور</th><th className="text-right py-2">الانصراف</th><th className="text-right py-2">الحالة</th></tr></thead>
                <tbody>{data.attendance.map((a, i) => (
                  <tr key={i} className="border-b last:border-0"><td className="py-2 pr-2">{a.date}</td><td className="py-2">{a.checkIn || "—"}</td><td className="py-2">{a.checkOut || "—"}</td><td className="py-2">{STATUS_MAP[a.status] || a.status}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string; color: string;
}) {
  const colors: Record<string, string> = {
    green: "bg-green-100 dark:bg-green-950/40 text-green-600",
    blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-600",
    purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
  };
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
