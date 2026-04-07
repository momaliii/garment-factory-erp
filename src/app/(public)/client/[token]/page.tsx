"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  ShieldAlert,
  Package,
  TrendingUp,
  Truck,
  Wallet,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Scissors,
} from "lucide-react";

interface OrderData {
  id: string;
  type: string;
  description: string | null;
  totalQuantity: number;
  unitPrice: number;
  totalValue: number;
  deadline: string;
  status: string;
  totalProduced: number;
  totalDelivered: number;
  remaining: number;
  progressPercent: number;
  daysLeft: number;
  createdAt: string;
  progress: { date: string; produced: number; delivered: number; notes: string | null }[];
  fabricReceiving: { date: string; fabricType: string | null; quantity: number; unit: string; notes: string | null }[];
}

interface PortalData {
  client: { name: string; phone: string | null };
  orders: OrderData[];
  summary: {
    totalOrders: number;
    completedOrders: number;
    totalQuantity: number;
    totalDelivered: number;
    totalValue: number;
    totalDeliveredValue: number;
    remainingValue: number;
  };
  tokenType: string;
  expiresAt: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "جديد", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950/40" },
  in_progress: { label: "جاري التصنيع", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/40" },
  delayed: { label: "متأخر", color: "text-red-600", bg: "bg-red-100 dark:bg-red-950/40" },
  completed: { label: "مكتمل", color: "text-green-600", bg: "bg-green-100 dark:bg-green-950/40" },
  delivered: { label: "تم التسليم", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
};

function formatCurrency(v: number) {
  return v.toLocaleString("ar-EG", { minimumFractionDigits: 0 });
}

export default function ClientPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortalData | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/client-portal/${token}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error || "رابط غير صالح");
          return;
        }
        setData(await res.json());
      } catch {
        setError("حدث خطأ في تحميل البيانات");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const toggleOrder = (id: string) => {
    setExpandedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">جاري تحميل بيانات العميل...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-5">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">رابط غير صالح</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {error || "هذا الرابط لم يعد صالحاً. تواصل مع المصنع للحصول على رابط جديد."}
          </p>
        </div>
      </div>
    );
  }

  const { client, orders, summary } = data;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-primary/90 to-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm opacity-80">بوابة العميل - مصنع الملابس</p>
              <h1 className="text-2xl font-bold">{client.name}</h1>
            </div>
          </div>
          {data.tokenType === "temporary" && data.expiresAt && (
            <p className="text-sm opacity-70 mt-2">
              رابط مؤقت -- ينتهي:{" "}
              {new Date(data.expiresAt).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Package} label="الأوردرات" value={summary.totalOrders} sub={`${summary.completedOrders} مكتمل`} color="blue" />
          <StatCard icon={TrendingUp} label="نسبة الإنجاز" value={summary.totalQuantity > 0 ? Math.round((summary.totalDelivered / summary.totalQuantity) * 100) : 0} sub="%" isPercent color="green" />
          <StatCard icon={Truck} label="تم التسليم" value={summary.totalDelivered} sub={`من ${summary.totalQuantity}`} color="amber" />
          <StatCard icon={Wallet} label="القيمة الإجمالية" value={formatCurrency(summary.totalValue)} sub={`متبقي: ${formatCurrency(summary.remainingValue)}`} color="purple" />
        </div>

        {/* Orders */}
        <h2 className="text-lg font-bold text-foreground mb-4">الأوردرات</h2>
        {orders.length === 0 ? (
          <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">لا توجد أوردرات</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.new;
              const expanded = expandedOrders.has(order.id);
              return (
                <div key={order.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color} ${st.bg}`}>{st.label}</span>
                          <span className="text-xs text-muted-foreground">{order.type === "cmt" ? "CMT" : "إنتاج كامل"}</span>
                        </div>
                        <p className="font-semibold text-foreground">{order.description || "أوردر بدون وصف"}</p>
                      </div>
                      <div className="text-left">
                        {order.daysLeft > 0 ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>باقي {order.daysLeft} يوم</span>
                          </div>
                        ) : order.status === "delivered" ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم التسليم</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>متأخر {Math.abs(order.daysLeft)} يوم</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>الإنجاز: {order.totalProduced} / {order.totalQuantity}</span>
                        <span>{order.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div
                          className="bg-primary rounded-full h-2.5 transition-all duration-500"
                          style={{ width: `${Math.min(order.progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>الكمية: {order.totalQuantity}</span>
                        <span>مُسلّم: {order.totalDelivered}</span>
                        <span>متبقي: {order.remaining}</span>
                      </div>
                      <button onClick={() => toggleOrder(order.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        <span>{expanded ? "إخفاء" : "التفاصيل"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expanded && (
                    <div className="border-t px-4 py-4 bg-muted/30 space-y-4">
                      {/* Deliveries */}
                      {order.progress.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">سجل التسليمات</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-muted-foreground text-xs border-b">
                                  <th className="text-right py-1.5 pr-2">التاريخ</th>
                                  <th className="text-right py-1.5">إنتاج</th>
                                  <th className="text-right py-1.5">تسليم</th>
                                  <th className="text-right py-1.5">ملاحظات</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.progress.map((p, i) => (
                                  <tr key={i} className="border-b last:border-0">
                                    <td className="py-1.5 pr-2">{p.date}</td>
                                    <td className="py-1.5">{p.produced}</td>
                                    <td className="py-1.5">{p.delivered}</td>
                                    <td className="py-1.5 text-muted-foreground">{p.notes || "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Fabric Receiving (CMT) */}
                      {order.type === "cmt" && order.fabricReceiving.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-2">استلام القماش</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-muted-foreground text-xs border-b">
                                  <th className="text-right py-1.5 pr-2">التاريخ</th>
                                  <th className="text-right py-1.5">النوع</th>
                                  <th className="text-right py-1.5">الكمية</th>
                                  <th className="text-right py-1.5">الوحدة</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.fabricReceiving.map((f, i) => (
                                  <tr key={i} className="border-b last:border-0">
                                    <td className="py-1.5 pr-2">{f.date}</td>
                                    <td className="py-1.5">{f.fabricType || "—"}</td>
                                    <td className="py-1.5">{f.quantity}</td>
                                    <td className="py-1.5">{f.unit === "meter" ? "متر" : f.unit === "kg" ? "كجم" : "رول"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Financial Summary */}
        <h2 className="text-lg font-bold text-foreground mt-8 mb-4">الملخص المالي</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs border-b">
                  <th className="text-right py-2.5 px-4">الأوردر</th>
                  <th className="text-right py-2.5 px-4">النوع</th>
                  <th className="text-right py-2.5 px-4">الكمية</th>
                  <th className="text-right py-2.5 px-4">سعر الوحدة</th>
                  <th className="text-right py-2.5 px-4">الإجمالي</th>
                  <th className="text-right py-2.5 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const st = STATUS_MAP[order.status] || STATUS_MAP.new;
                  return (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-2.5 px-4 font-medium">{order.description || "—"}</td>
                      <td className="py-2.5 px-4">{order.type === "cmt" ? "CMT" : "إنتاج كامل"}</td>
                      <td className="py-2.5 px-4">{order.totalQuantity}</td>
                      <td className="py-2.5 px-4">{formatCurrency(order.unitPrice)}</td>
                      <td className="py-2.5 px-4 font-semibold">{formatCurrency(order.totalValue)}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.color} ${st.bg}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/30 font-semibold">
                  <td colSpan={4} className="py-2.5 px-4">الإجمالي</td>
                  <td className="py-2.5 px-4">{formatCurrency(summary.totalValue)}</td>
                  <td className="py-2.5 px-4 text-xs text-muted-foreground">متبقي: {formatCurrency(summary.remainingValue)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="text-center mt-12 text-xs text-muted-foreground/60">
          بوابة العميل - نظام إدارة مصنع الملابس
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, isPercent }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
  color: string;
  isPercent?: boolean;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-600",
    green: "bg-green-100 dark:bg-green-950/40 text-green-600",
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600",
    purple: "bg-purple-100 dark:bg-purple-950/40 text-purple-600",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xl font-bold text-foreground">
        {value}{isPercent ? "%" : ""}
      </p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
