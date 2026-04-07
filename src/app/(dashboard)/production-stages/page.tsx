"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Plus, ChevronDown, ChevronUp } from "lucide-react";

interface Stage {
  id: string; stage: string; status: string; assigneeId: string | null;
  notes: string | null; startedAt: string | null; completedAt: string | null;
  order: { id: string; description: string | null; client: { name: string } };
}

interface OrderOption { id: string; description: string | null; }

const STAGE_LABELS: Record<string, string> = {
  cutting: "قص", sewing: "خياطة", finishing: "تشطيب",
  ironing: "كي", quality: "جودة", packing: "تعبئة",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "انتظار", color: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  in_progress: { label: "جاري", color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  completed: { label: "مكتمل", color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" },
};

export default function ProductionStagesPage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const [sRes, oRes] = await Promise.all([
        fetch("/api/production-stages"),
        fetch("/api/orders"),
      ]);
      if (sRes.ok) setStages(await sRes.json());
      if (oRes.ok) {
        const data = await oRes.json();
        setOrders(Array.isArray(data) ? data : data.data || []);
      }
    } catch { toast.error("خطأ"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const initStages = async (orderId: string) => {
    try {
      const res = await fetch("/api/production-stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "خطأ");
        return;
      }
      toast.success("تم إنشاء المراحل");
      load();
    } catch { toast.error("خطأ"); }
  };

  const updateStage = async (id: string, status: string) => {
    try {
      await fetch(`/api/production-stages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      load();
    } catch { toast.error("خطأ"); }
  };

  const toggleExpand = (orderId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  // Group stages by order
  const orderGroups = new Map<string, { order: Stage["order"]; stages: Stage[] }>();
  stages.forEach((s) => {
    if (!orderGroups.has(s.order.id)) orderGroups.set(s.order.id, { order: s.order, stages: [] });
    orderGroups.get(s.order.id)!.stages.push(s);
  });

  const ordersWithStages = new Set(Array.from(orderGroups.keys()));
  const ordersWithoutStages = orders.filter((o) => !ordersWithStages.has(o.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مراحل الإنتاج</h1>
          <p className="text-muted-foreground text-sm">تتبع مراحل تصنيع كل أوردر</p>
        </div>
      </div>

      {ordersWithoutStages.length > 0 && (
        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm mb-3">إنشاء مراحل لأوردر:</h3>
          <div className="flex flex-wrap gap-2">
            {ordersWithoutStages.slice(0, 10).map((o) => (
              <button key={o.id} onClick={() => initStages(o.id)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors">
                <Plus className="w-3.5 h-3.5" />
                {o.description || "أوردر بدون وصف"}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {Array.from(orderGroups.entries()).map(([orderId, { order, stages: orderStages }]) => {
          const completedCount = orderStages.filter((s) => s.status === "completed").length;
          const totalCount = orderStages.length;
          const isExpanded = expanded.has(orderId);

          return (
            <div key={orderId} className="bg-card border rounded-xl overflow-hidden">
              <button onClick={() => toggleExpand(orderId)} className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-right">
                <div>
                  <p className="font-semibold text-sm">{order.description || "أوردر"} — {order.client.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{completedCount}/{totalCount} مراحل مكتملة</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {orderStages.map((s) => (
                      <div key={s.id} className={`w-6 h-2 rounded-full ${s.status === "completed" ? "bg-green-500" : s.status === "in_progress" ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-700"}`} title={STAGE_LABELS[s.stage]} />
                    ))}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-3 bg-muted/20">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {orderStages.map((s, i) => {
                      const st = STATUS_LABELS[s.status] || STATUS_LABELS.pending;
                      const prevCompleted = i === 0 || orderStages[i - 1].status === "completed";
                      return (
                        <div key={s.id} className="bg-card border rounded-xl p-3 text-center">
                          <p className="font-medium text-sm mb-1">{STAGE_LABELS[s.stage]}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                          <div className="mt-2 flex flex-col gap-1">
                            {s.status === "pending" && prevCompleted && (
                              <button onClick={() => updateStage(s.id, "in_progress")} className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 px-2 py-1 rounded hover:opacity-80">ابدأ</button>
                            )}
                            {s.status === "in_progress" && (
                              <button onClick={() => updateStage(s.id, "completed")} className="text-xs bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400 px-2 py-1 rounded hover:opacity-80">اكتمل</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {orderGroups.size === 0 && (
        <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">
          لا توجد مراحل إنتاج. أنشئ مراحل لأوردر من الأعلى.
        </div>
      )}
    </div>
  );
}
