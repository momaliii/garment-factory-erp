"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowLeft,
  Loader2,
  ReceiptText,
  CircleDollarSign,
  FolderOpen,
  BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

interface MonthlyReport {
  month: string;
  expensesByCategory: { name: string; total: number }[];
  revenuesByCategory: { name: string; total: number }[];
  totalExpenses: number;
  totalRevenues: number;
  netProfit: number;
}

interface ComparisonMonth {
  month: string;
  expenses: number;
  revenues: number;
  profit: number;
}

function formatCurrency(v: number) {
  return v.toLocaleString("ar-EG", { minimumFractionDigits: 0 });
}

export default function FinancePage() {
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [comparison, setComparison] = useState<ComparisonMonth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mRes, cRes] = await Promise.all([
          fetch("/api/finance/reports?type=monthly"),
          fetch("/api/finance/reports?type=comparison&months=6"),
        ]);
        if (mRes.ok) setMonthly(await mRes.json());
        if (cRes.ok) {
          const data = await cRes.json();
          setComparison(data.months || []);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const quickLinks = [
    { label: "المصروفات", href: "/finance/expenses", icon: ReceiptText, color: "text-red-600 bg-red-100 dark:bg-red-950/40" },
    { label: "الإيرادات", href: "/finance/revenues", icon: CircleDollarSign, color: "text-green-600 bg-green-100 dark:bg-green-950/40" },
    { label: "البنود", href: "/finance/categories", icon: FolderOpen, color: "text-blue-600 bg-blue-100 dark:bg-blue-950/40" },
    { label: "التقارير المالية", href: "/finance/reports", icon: BarChart3, color: "text-purple-600 bg-purple-100 dark:bg-purple-950/40" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">المحاسبة</h1>
        <p className="text-muted-foreground text-sm">إدارة المصروفات والإيرادات والتقارير المالية</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={TrendingDown} label="مصروفات الشهر" value={formatCurrency(monthly?.totalExpenses || 0)} color="red" />
        <StatCard icon={TrendingUp} label="إيرادات الشهر" value={formatCurrency(monthly?.totalRevenues || 0)} color="green" />
        <StatCard
          icon={DollarSign}
          label="صافي الربح"
          value={formatCurrency(monthly?.netProfit || 0)}
          color={(monthly?.netProfit || 0) >= 0 ? "green" : "red"}
        />
        <StatCard icon={Wallet} label="بنود المصروفات" value={String(monthly?.expensesByCategory?.length || 0)} color="blue" />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${link.color}`}>
              <link.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">{link.label}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>فتح</span>
                <ArrowLeft className="w-3 h-3" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparison Chart */}
        {comparison.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">مصروفات vs إيرادات - آخر 6 أشهر</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="revenues" stroke="#22c55e" name="إيرادات" strokeWidth={2} />
                <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="مصروفات" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Expense Categories */}
        {monthly && monthly.expensesByCategory.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4">أعلى بنود المصروفات - هذا الشهر</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthly.expensesByCategory.sort((a, b) => b.total - a.total).slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="total" fill="#ef4444" radius={[0, 4, 4, 0]} name="المبلغ" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    red: "bg-red-100 dark:bg-red-950/40 text-red-600",
    green: "bg-green-100 dark:bg-green-950/40 text-green-600",
    blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-600",
    purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}
