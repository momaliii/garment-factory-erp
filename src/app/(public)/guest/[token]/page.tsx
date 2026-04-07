"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Loader2,
  ShieldAlert,
  Eye,
  Clock,
  Lock,
} from "lucide-react";
import { PERMISSION_MODULES } from "@/lib/permissions";

interface GuestData {
  name: string;
  permissions: Record<string, boolean>;
  expiresAt: string;
}

const MODULE_ICONS: Record<string, string> = {
  dashboard: "📊",
  employees: "👥",
  attendance: "📋",
  production: "🏭",
  payroll: "💰",
  clients: "🤝",
  orders: "📦",
  machines: "⚙️",
  reports: "📈",
  ai: "🤖",
};

export default function GuestViewPage() {
  const params = useParams();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<GuestData | null>(null);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/guest/${token}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        setData(await res.json());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">جاري التحقق من اللينك...</p>
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
          <h1 className="text-xl font-bold text-foreground mb-2">
            اللينك غير صالح أو منتهي
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            هذا الرابط المؤقت لم يعد صالحاً. قد يكون منتهي الصلاحية أو تم
            حذفه. تواصل مع من أرسل لك الرابط للحصول على رابط جديد.
          </p>
        </div>
      </div>
    );
  }

  const permittedModules = PERMISSION_MODULES.filter(
    (m) => data.permissions[m.key] && !["admin", "guest_links", "settings"].includes(m.key)
  );

  const expiryDate = new Date(data.expiresAt).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-center gap-3 text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-amber-800 dark:text-amber-300 font-medium">
            عرض مؤقت - للقراءة فقط
          </span>
          <span className="text-amber-600/70 dark:text-amber-400/60 hidden sm:inline">
            |
          </span>
          <span className="text-amber-600/70 dark:text-amber-400/60 text-xs hidden sm:inline">
            ينتهي: {expiryDate}
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Eye className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            {data.name}
          </h1>
          <p className="text-muted-foreground text-sm">
            نظام إدارة مصنع الملابس - عرض مؤقت
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">الوصول</p>
              <p className="text-sm font-medium">قراءة فقط</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">ينتهي في</p>
              <p className="text-sm font-medium">{expiryDate}</p>
            </div>
          </div>
        </div>

        {/* Permitted Modules */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
            الأقسام المتاحة
          </h2>
          {permittedModules.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm">
              لا توجد أقسام متاحة
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
              {permittedModules.map((mod) => (
                <div
                  key={mod.key}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-primary/30 transition-colors"
                >
                  <span className="text-2xl">
                    {MODULE_ICONS[mod.key] || "📄"}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {mod.label}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    قراءة فقط
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-xs text-muted-foreground/60">
          هذا رابط مؤقت تمت مشاركته من نظام إدارة مصنع الملابس
        </div>
      </div>
    </div>
  );
}
