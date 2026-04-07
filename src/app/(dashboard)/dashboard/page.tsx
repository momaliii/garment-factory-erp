"use client";

import { useEffect, useState, useCallback } from "react";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Factory,
  ClipboardList,
  Banknote,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { formatCurrency, formatNumber, getOrderStatusLabel, getOrderStatusColor, getDaysRemaining } from "@/lib/utils";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DashboardData {
  employeeCount: number;
  presentToday: number;
  todayProduction: number;
  activeOrders: number;
  delayedOrders: number;
  recentOrders: Array<{
    id: string;
    description: string;
    clientName: string;
    status: string;
    deadline: string;
    totalQuantity: number;
    produced: number;
  }>;
  topProducers: Array<{ name: string; total: number }>;
  monthlyPayroll: number;
  productionTrend: Array<{ date: string; quantity: number }>;
  orderDistribution: Array<{ status: string; count: number }>;
  attendanceTrend: Array<{ date: string; present: number }>;
}

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#22c55e", "#10b981"];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        setData(await res.json());
        setLastRefresh(new Date());
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">ملخص عام لنشاط المصنع</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>آخر تحديث: {lastRefresh.toLocaleTimeString("ar-EG")}</span>
          <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="تحديث">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="الموظفين" value={formatNumber(data.employeeCount)} subtitle={`${formatNumber(data.presentToday)} حاضر اليوم`} icon={Users} iconClassName="bg-blue-500" />
        <StatCard title="إنتاج اليوم" value={formatNumber(data.todayProduction)} subtitle="قطعة" icon={Factory} iconClassName="bg-green-500" />
        <StatCard title="أوردرات نشطة" value={formatNumber(data.activeOrders)} subtitle={data.delayedOrders > 0 ? `${data.delayedOrders} متأخر` : "لا يوجد متأخر"} icon={ClipboardList} iconClassName={data.delayedOrders > 0 ? "bg-red-500" : "bg-purple-500"} />
        <StatCard title="المرتبات الشهرية" value={formatCurrency(data.monthlyPayroll)} subtitle="تقدير" icon={Banknote} iconClassName="bg-amber-500" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Production Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">إنتاج آخر 14 يوم</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.productionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => `التاريخ: ${v}`} formatter={(value) => [`${Number(value)} قطعة`, "الإنتاج"]} />
                <Line type="monotone" dataKey="quantity" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} name="الإنتاج" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">توزيع حالات الأوردرات</CardTitle>
          </CardHeader>
          <CardContent>
            {data.orderDistribution.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-16">لا توجد أوردرات</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.orderDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {data.orderDistribution.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Attendance Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">الحضور - آخر 7 أيام</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={(v) => `التاريخ: ${v}`} formatter={(value) => [`${Number(value)} موظف`, "حاضر"]} />
                <Area type="monotone" dataKey="present" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} name="حاضر" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Producers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              أعلى إنتاجية هذا الشهر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topProducers.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">لا توجد بيانات إنتاج</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topProducers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip formatter={(value) => [`${Number(value)} قطعة`, "الإنتاج"]} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="الإنتاج" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-5 w-5" />
            أحدث الأوردرات
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">لا توجد أوردرات</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.map((order) => {
                const days = getDaysRemaining(order.deadline);
                const progress = order.totalQuantity > 0 ? Math.round((order.produced / order.totalQuantity) * 100) : 0;
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{order.description || "بدون وصف"}</p>
                      <p className="text-xs text-muted-foreground">{order.clientName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-left space-y-1">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground">{progress}%</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={getOrderStatusColor(order.status)} variant="secondary">
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                        {days <= 3 && days >= 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="h-3 w-3" />
                            {days === 0 ? "اليوم" : `${days} يوم`}
                          </span>
                        )}
                        {days < 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3" />
                            متأخر {Math.abs(days)} يوم
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
