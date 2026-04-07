"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface LogEntry {
  id: string; userId: string | null; userName: string | null;
  action: string; entity: string; entityId: string | null;
  changes: string | null; createdAt: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "إنشاء", color: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400" },
  update: { label: "تعديل", color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  delete: { label: "حذف", color: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterEntity) params.set("entity", filterEntity);
      if (filterAction) params.set("action", filterAction);

      const res = await fetch(`/api/audit-log?${params}`);
      if (res.ok) setLogs(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [filterEntity, filterAction]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">سجل التغييرات</h1>
        <p className="text-muted-foreground text-sm">تتبع كل التعديلات في النظام</p>
      </div>

      <div className="bg-card border rounded-xl p-4 flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">الكيان</label>
          <select value={filterEntity} onChange={(e) => setFilterEntity(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background">
            <option value="">الكل</option>
            <option value="employee">موظف</option>
            <option value="order">أوردر</option>
            <option value="client">عميل</option>
            <option value="expense">مصروف</option>
            <option value="revenue">إيراد</option>
            <option value="inventory">مخزون</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">الإجراء</label>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background">
            <option value="">الكل</option>
            <option value="create">إنشاء</option>
            <option value="update">تعديل</option>
            <option value="delete">حذف</option>
          </select>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs border-b">
                <th className="text-right py-2.5 px-4">التاريخ</th>
                <th className="text-right py-2.5 px-4">المستخدم</th>
                <th className="text-right py-2.5 px-4">الإجراء</th>
                <th className="text-right py-2.5 px-4">الكيان</th>
                <th className="text-right py-2.5 px-4">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const a = ACTION_LABELS[log.action] || { label: log.action, color: "bg-gray-100 text-gray-700" };
                return (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-2.5 px-4 text-xs">{new Date(log.createdAt).toLocaleString("ar-EG")}</td>
                    <td className="py-2.5 px-4">{log.userName || "نظام"}</td>
                    <td className="py-2.5 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${a.color}`}>{a.label}</span></td>
                    <td className="py-2.5 px-4">{log.entity}</td>
                    <td className="py-2.5 px-4 text-muted-foreground text-xs max-w-xs truncate">{log.changes || "—"}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">لا توجد سجلات</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
