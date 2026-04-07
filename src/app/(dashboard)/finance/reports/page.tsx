"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

function formatCurrency(v: number) { return v.toLocaleString("ar-EG", { minimumFractionDigits: 0 }); }

type ReportTab = "monthly" | "profit-loss" | "comparison" | "statement";

export default function FinanceReportsPage() {
  const [tab, setTab] = useState<ReportTab>("monthly");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [compMonths, setCompMonths] = useState("6");

  const loadReport = async () => {
    setLoading(true);
    setData(null);
    try {
      let url = "/api/finance/reports?type=" + tab;
      if (tab === "monthly") url += `&month=${month}`;
      if (tab === "profit-loss") { if (from) url += `&from=${from}`; if (to) url += `&to=${to}`; }
      if (tab === "comparison") url += `&months=${compMonths}`;
      if (tab === "statement") { if (from) url += `&from=${from}`; if (to) url += `&to=${to}`; }
      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const tabs: { key: ReportTab; label: string }[] = [
    { key: "monthly", label: "ملخص شهري" },
    { key: "profit-loss", label: "ربح / خسارة" },
    { key: "comparison", label: "مقارنة شهور" },
    { key: "statement", label: "كشف حساب" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التقارير المالية</h1>
        <p className="text-muted-foreground text-sm">تحليل المصروفات والإيرادات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setData(null); }} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t.key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Params */}
      <div className="bg-card border rounded-xl p-4 flex flex-wrap gap-4 items-end">
        {tab === "monthly" && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">الشهر</label>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
          </div>
        )}
        {(tab === "profit-loss" || tab === "statement") && (
          <>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">من</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">إلى</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
            </div>
          </>
        )}
        {tab === "comparison" && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">عدد الشهور</label>
            <select value={compMonths} onChange={(e) => setCompMonths(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background">
              <option value="3">3 شهور</option>
              <option value="6">6 شهور</option>
              <option value="12">12 شهر</option>
            </select>
          </div>
        )}
        <button onClick={loadReport} disabled={loading} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "عرض التقرير"}
        </button>
      </div>

      {/* Results */}
      {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>}

      {data && tab === "monthly" && <MonthlyReport data={data} />}
      {data && tab === "profit-loss" && <ProfitLossReport data={data} />}
      {data && tab === "comparison" && <ComparisonReport data={data} />}
      {data && tab === "statement" && <StatementReport data={data} />}
    </div>
  );
}

function MonthlyReport({ data }: { data: Record<string, unknown> }) {
  const d = data as { month: string; expensesByCategory: { name: string; total: number }[]; revenuesByCategory: { name: string; total: number }[]; totalExpenses: number; totalRevenues: number; netProfit: number };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 text-center"><p className="text-xs text-muted-foreground mb-1">مصروفات</p><p className="text-xl font-bold text-red-600">{formatCurrency(d.totalExpenses)}</p></div>
        <div className="bg-card border rounded-xl p-4 text-center"><p className="text-xs text-muted-foreground mb-1">إيرادات</p><p className="text-xl font-bold text-green-600">{formatCurrency(d.totalRevenues)}</p></div>
        <div className="bg-card border rounded-xl p-4 text-center"><p className="text-xs text-muted-foreground mb-1">صافي</p><p className={`text-xl font-bold ${d.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(d.netProfit)}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-3">المصروفات حسب البند</h3>
          {d.expensesByCategory.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مصروفات</p> : (
            <table className="w-full text-sm">
              <tbody>{d.expensesByCategory.map((c, i) => (
                <tr key={i} className="border-b last:border-0"><td className="py-2">{c.name}</td><td className="py-2 text-left font-semibold text-red-600">{formatCurrency(c.total)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-3">الإيرادات حسب البند</h3>
          {d.revenuesByCategory.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد إيرادات</p> : (
            <table className="w-full text-sm">
              <tbody>{d.revenuesByCategory.map((c, i) => (
                <tr key={i} className="border-b last:border-0"><td className="py-2">{c.name}</td><td className="py-2 text-left font-semibold text-green-600">{formatCurrency(c.total)}</td></tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ProfitLossReport({ data }: { data: Record<string, unknown> }) {
  const d = data as { totalExpenses: number; totalRevenues: number; netProfit: number; expenseDetails: { name: string; total: number }[]; revenueDetails: { name: string; total: number }[] };
  return (
    <div className="space-y-6">
      <div className={`bg-card border rounded-xl p-6 text-center ${d.netProfit >= 0 ? "border-green-200" : "border-red-200"}`}>
        <p className="text-sm text-muted-foreground mb-1">النتيجة</p>
        <p className={`text-3xl font-bold ${d.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(d.netProfit)} جنيه</p>
        <p className="text-sm text-muted-foreground mt-1">{d.netProfit >= 0 ? "ربح" : "خسارة"}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-3 text-red-600">المصروفات: {formatCurrency(d.totalExpenses)}</h3>
          {d.expenseDetails.map((c, i) => <div key={i} className="flex justify-between py-1.5 text-sm border-b last:border-0"><span>{c.name}</span><span className="font-medium">{formatCurrency(c.total)}</span></div>)}
        </div>
        <div className="bg-card border rounded-xl p-5">
          <h3 className="font-semibold mb-3 text-green-600">الإيرادات: {formatCurrency(d.totalRevenues)}</h3>
          {d.revenueDetails.map((c, i) => <div key={i} className="flex justify-between py-1.5 text-sm border-b last:border-0"><span>{c.name}</span><span className="font-medium">{formatCurrency(c.total)}</span></div>)}
        </div>
      </div>
    </div>
  );
}

function ComparisonReport({ data }: { data: Record<string, unknown> }) {
  const d = data as { months: { month: string; expenses: number; revenues: number; profit: number }[] };
  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold mb-4">مقارنة الشهور</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={d.months}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Bar dataKey="revenues" fill="#22c55e" name="إيرادات" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="#ef4444" name="مصروفات" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card border rounded-xl p-5">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={d.months}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
            <Legend />
            <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="صافي الربح" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-card border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50 text-xs text-muted-foreground border-b">
            <th className="text-right py-2.5 px-4">الشهر</th>
            <th className="text-right py-2.5 px-4">إيرادات</th>
            <th className="text-right py-2.5 px-4">مصروفات</th>
            <th className="text-right py-2.5 px-4">صافي</th>
          </tr></thead>
          <tbody>{d.months.map((m) => (
            <tr key={m.month} className="border-b last:border-0">
              <td className="py-2.5 px-4">{m.month}</td>
              <td className="py-2.5 px-4 text-green-600 font-medium">{formatCurrency(m.revenues)}</td>
              <td className="py-2.5 px-4 text-red-600 font-medium">{formatCurrency(m.expenses)}</td>
              <td className={`py-2.5 px-4 font-semibold ${m.profit >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(m.profit)}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

function StatementReport({ data }: { data: Record<string, unknown> }) {
  const d = data as { statement: { type: string; date: string; amount: number; category: string; description: string | null; balance: number }[] };
  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50 text-xs text-muted-foreground border-b">
            <th className="text-right py-2.5 px-4">التاريخ</th>
            <th className="text-right py-2.5 px-4">النوع</th>
            <th className="text-right py-2.5 px-4">البند</th>
            <th className="text-right py-2.5 px-4">الوصف</th>
            <th className="text-right py-2.5 px-4">المبلغ</th>
            <th className="text-right py-2.5 px-4">الرصيد</th>
          </tr></thead>
          <tbody>{d.statement.map((e, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
              <td className="py-2.5 px-4">{e.date}</td>
              <td className="py-2.5 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${e.type === "revenue" ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"}`}>{e.type === "revenue" ? "إيراد" : "مصروف"}</span></td>
              <td className="py-2.5 px-4">{e.category}</td>
              <td className="py-2.5 px-4 text-muted-foreground">{e.description || "—"}</td>
              <td className={`py-2.5 px-4 font-medium ${e.type === "revenue" ? "text-green-600" : "text-red-600"}`}>{e.type === "revenue" ? "+" : "-"}{formatCurrency(e.amount)}</td>
              <td className={`py-2.5 px-4 font-semibold ${e.balance >= 0 ? "text-green-600" : "text-red-600"}`}>{formatCurrency(e.balance)}</td>
            </tr>
          ))}</tbody>
          {d.statement.length === 0 && <tbody><tr><td colSpan={6} className="py-8 text-center text-muted-foreground">لا توجد حركات في هذه الفترة</td></tr></tbody>}
        </table>
      </div>
    </div>
  );
}
