"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Factory,
  Users,
  Clock,
  Banknote,
  TrendingUp,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Award,
  UserX,
  Timer,
  Minus,
  BarChart3,
} from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  getCurrentMonth,
  getOrderStatusLabel,
  getOrderStatusColor,
} from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProductionReport {
  stats: {
    totalProduction: number;
    workerCount: number;
    topProducer: number;
    dailyAverage: number;
  };
  employees: Array<{
    id: string;
    name: string;
    totalPieces: number;
    workDays: number;
    dailyAverage: number;
  }>;
  chartData: Array<{ name: string; total: number }>;
}

interface AttendanceReport {
  stats: {
    totalWorkDays: number;
    avgAttendance: number;
    totalAbsence: number;
    totalLate: number;
  };
  employees: Array<{
    id: string;
    name: string;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  }>;
}

interface PayrollReport {
  stats: {
    totalSalaries: number;
    totalBonus: number;
    totalDeductions: number;
    employeeCount: number;
  };
  employees: Array<{
    id: string;
    name: string;
    baseSalary: number;
    attendanceBonus: number;
    productionBonus: number;
    deductions: number;
    netSalary: number;
  }>;
}

interface OrdersReport {
  stats: {
    totalOrders: number;
    activeOrders: number;
    completedOrders: number;
    delayedOrders: number;
  };
  orders: Array<{
    id: string;
    clientName: string;
    description: string;
    totalQuantity: number;
    totalProduced: number;
    totalDelivered: number;
    remaining: number;
    deadline: string;
    status: string;
  }>;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("production");
  const [month, setMonth] = useState(getCurrentMonth());
  const [orderStatus, setOrderStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [productionData, setProductionData] =
    useState<ProductionReport | null>(null);
  const [attendanceData, setAttendanceData] =
    useState<AttendanceReport | null>(null);
  const [payrollData, setPayrollData] = useState<PayrollReport | null>(null);
  const [ordersData, setOrdersData] = useState<OrdersReport | null>(null);

  const fetchReport = useCallback(
    async (tab: string) => {
      setLoading(true);
      try {
        let url = `/api/reports?type=${tab}`;
        if (tab === "orders") {
          url += `&status=${orderStatus}`;
        } else {
          url += `&month=${month}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        switch (tab) {
          case "production":
            setProductionData(data);
            break;
          case "attendance":
            setAttendanceData(data);
            break;
          case "payroll":
            setPayrollData(data);
            break;
          case "orders":
            setOrdersData(data);
            break;
        }
      } catch (error) {
        console.error("Error fetching report:", error);
      } finally {
        setLoading(false);
      }
    },
    [month, orderStatus]
  );

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab, fetchReport]);

  return (
    <div className="space-y-6">
      <PageHeader title="التقارير" description="تقارير شاملة عن نشاط المصنع" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="production" className="gap-2">
            <Factory className="h-4 w-4" />
            تقرير الانتاج
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="h-4 w-4" />
            تقرير الحضور
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Banknote className="h-4 w-4" />
            تقرير المرتبات
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            تقرير الأوردرات
          </TabsTrigger>
        </TabsList>

        {/* Production Report */}
        <TabsContent value="production">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">الشهر:</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : productionData ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="إجمالي الانتاج"
                    value={formatNumber(productionData.stats.totalProduction)}
                    subtitle="قطعة"
                    icon={Factory}
                    iconClassName="bg-blue-500"
                  />
                  <StatCard
                    title="عدد العمال"
                    value={formatNumber(productionData.stats.workerCount)}
                    icon={Users}
                    iconClassName="bg-green-500"
                  />
                  <StatCard
                    title="أعلى إنتاجية"
                    value={formatNumber(productionData.stats.topProducer)}
                    subtitle="قطعة"
                    icon={Award}
                    iconClassName="bg-purple-500"
                  />
                  <StatCard
                    title="متوسط يومي"
                    value={formatNumber(productionData.stats.dailyAverage)}
                    subtitle="قطعة / عامل"
                    icon={TrendingUp}
                    iconClassName="bg-amber-500"
                  />
                </div>

                {productionData.chartData.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BarChart3 className="h-5 w-5" />
                        أعلى ١٠ عمال إنتاجية
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={productionData.chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis
                              dataKey="name"
                              type="category"
                              width={70}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                              formatter={(value) => [
                                `${formatNumber(Number(value))} قطعة`,
                                "الانتاج",
                              ]}
                            />
                            <Bar
                              dataKey="total"
                              fill="hsl(var(--primary))"
                              radius={[0, 4, 4, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">تفاصيل الانتاج</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
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
                            </tr>
                          </thead>
                          <tbody>
                            {productionData.employees.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={4}
                                  className="px-4 py-12 text-center text-muted-foreground"
                                >
                                  لا توجد بيانات إنتاج لهذا الشهر
                                </td>
                              </tr>
                            ) : (
                              productionData.employees.map((emp) => (
                                <tr
                                  key={emp.id}
                                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {emp.name}
                                  </td>
                                  <td className="px-4 py-3">
                                    {formatNumber(emp.totalPieces)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {formatNumber(emp.workDays)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {formatNumber(emp.dailyAverage)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </TabsContent>

        {/* Attendance Report */}
        <TabsContent value="attendance">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">الشهر:</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : attendanceData ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="أيام العمل"
                    value={formatNumber(attendanceData.stats.totalWorkDays)}
                    subtitle="يوم"
                    icon={CalendarDays}
                    iconClassName="bg-blue-500"
                  />
                  <StatCard
                    title="متوسط الحضور"
                    value={`${attendanceData.stats.avgAttendance}%`}
                    icon={CheckCircle2}
                    iconClassName="bg-green-500"
                  />
                  <StatCard
                    title="إجمالي الغياب"
                    value={formatNumber(attendanceData.stats.totalAbsence)}
                    subtitle="يوم"
                    icon={UserX}
                    iconClassName="bg-red-500"
                  />
                  <StatCard
                    title="إجمالي التأخير"
                    value={formatNumber(attendanceData.stats.totalLate)}
                    subtitle="يوم"
                    icon={Timer}
                    iconClassName="bg-amber-500"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      تفاصيل الحضور
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                الموظف
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                أيام الحضور
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                أيام الغياب
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                أيام التأخير
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                نسبة الحضور
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.employees.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-4 py-12 text-center text-muted-foreground"
                                >
                                  لا توجد بيانات حضور لهذا الشهر
                                </td>
                              </tr>
                            ) : (
                              attendanceData.employees.map((emp) => (
                                <tr
                                  key={emp.id}
                                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {emp.name}
                                  </td>
                                  <td className="px-4 py-3">
                                    {formatNumber(emp.presentDays)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {emp.absentDays > 0 ? (
                                      <span className="text-red-600">
                                        {formatNumber(emp.absentDays)}
                                      </span>
                                    ) : (
                                      formatNumber(emp.absentDays)
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {emp.lateDays > 0 ? (
                                      <span className="text-amber-600">
                                        {formatNumber(emp.lateDays)}
                                      </span>
                                    ) : (
                                      formatNumber(emp.lateDays)
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge
                                      variant={
                                        emp.attendanceRate >= 90
                                          ? "success"
                                          : emp.attendanceRate >= 70
                                            ? "warning"
                                            : "destructive"
                                      }
                                    >
                                      {emp.attendanceRate}%
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </TabsContent>

        {/* Payroll Report */}
        <TabsContent value="payroll">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">الشهر:</label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="flex h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : payrollData ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="إجمالي المرتبات"
                    value={formatCurrency(payrollData.stats.totalSalaries)}
                    icon={Banknote}
                    iconClassName="bg-blue-500"
                  />
                  <StatCard
                    title="إجمالي البونص"
                    value={formatCurrency(payrollData.stats.totalBonus)}
                    icon={TrendingUp}
                    iconClassName="bg-green-500"
                  />
                  <StatCard
                    title="إجمالي الخصومات"
                    value={formatCurrency(payrollData.stats.totalDeductions)}
                    icon={Minus}
                    iconClassName="bg-red-500"
                  />
                  <StatCard
                    title="عدد الموظفين"
                    value={formatNumber(payrollData.stats.employeeCount)}
                    icon={Users}
                    iconClassName="bg-purple-500"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      تفاصيل المرتبات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                الموظف
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                الأساسي
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                بونص انتظام
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                بونص انتاج
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                خصومات
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                صافي
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {payrollData.employees.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="px-4 py-12 text-center text-muted-foreground"
                                >
                                  لا توجد بيانات مرتبات لهذا الشهر
                                </td>
                              </tr>
                            ) : (
                              payrollData.employees.map((emp) => (
                                <tr
                                  key={emp.id}
                                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {emp.name}
                                  </td>
                                  <td className="px-4 py-3">
                                    {formatCurrency(emp.baseSalary)}
                                  </td>
                                  <td className="px-4 py-3 text-green-600">
                                    {formatCurrency(emp.attendanceBonus)}
                                  </td>
                                  <td className="px-4 py-3 text-green-600">
                                    {formatCurrency(emp.productionBonus)}
                                  </td>
                                  <td className="px-4 py-3 text-red-600">
                                    {formatCurrency(emp.deductions)}
                                  </td>
                                  <td className="px-4 py-3 font-bold">
                                    {formatCurrency(emp.netSalary)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </TabsContent>

        {/* Orders Report */}
        <TabsContent value="orders">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">الحالة:</label>
              <Select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-48"
              >
                <option value="all">الكل</option>
                <option value="new">جديد</option>
                <option value="in_progress">جاري التنفيذ</option>
                <option value="delayed">متأخر</option>
                <option value="completed">مكتمل</option>
                <option value="delivered">تم التسليم</option>
              </Select>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : ordersData ? (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="إجمالي الأوردرات"
                    value={formatNumber(ordersData.stats.totalOrders)}
                    icon={ClipboardList}
                    iconClassName="bg-blue-500"
                  />
                  <StatCard
                    title="نشط"
                    value={formatNumber(ordersData.stats.activeOrders)}
                    icon={Clock}
                    iconClassName="bg-amber-500"
                  />
                  <StatCard
                    title="مكتمل"
                    value={formatNumber(ordersData.stats.completedOrders)}
                    icon={CheckCircle2}
                    iconClassName="bg-green-500"
                  />
                  <StatCard
                    title="متأخر"
                    value={formatNumber(ordersData.stats.delayedOrders)}
                    icon={AlertTriangle}
                    iconClassName="bg-red-500"
                  />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      تفاصيل الأوردرات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                العميل
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                الوصف
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                الكمية
                              </th>
                              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                تم الانتاج
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
                                الحالة
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ordersData.orders.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={8}
                                  className="px-4 py-12 text-center text-muted-foreground"
                                >
                                  لا توجد أوردرات
                                </td>
                              </tr>
                            ) : (
                              ordersData.orders.map((order) => (
                                <tr
                                  key={order.id}
                                  className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium">
                                    {order.clientName}
                                  </td>
                                  <td className="px-4 py-3">
                                    {order.description}
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
                                  <td className="px-4 py-3">
                                    {order.remaining > 0 ? (
                                      <span className="text-red-600">
                                        {formatNumber(order.remaining)}
                                      </span>
                                    ) : (
                                      <span className="text-green-600">٠</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    {order.deadline}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge
                                      className={getOrderStatusColor(
                                        order.status
                                      )}
                                      variant="secondary"
                                    >
                                      {getOrderStatusLabel(order.status)}
                                    </Badge>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-[40vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );
}
