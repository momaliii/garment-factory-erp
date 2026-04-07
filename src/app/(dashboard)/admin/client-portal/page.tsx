"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Link2,
  Plus,
  Copy,
  Trash2,
  Loader2,
  ExternalLink,
  User,
} from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

interface PortalTokenItem {
  id: string;
  token: string;
  type: string;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  client: { id: string; name: string };
}

export default function ClientPortalAdminPage() {
  const [tokens, setTokens] = useState<PortalTokenItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formClientId, setFormClientId] = useState("");
  const [formType, setFormType] = useState("permanent");
  const [formExpiry, setFormExpiry] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [tokensRes, clientsRes] = await Promise.all([
        fetch("/api/admin/client-portal"),
        fetch("/api/clients"),
      ]);
      if (tokensRes.ok) setTokens(await tokensRes.json());
      if (clientsRes.ok) {
        const c = await clientsRes.json();
        setClients(Array.isArray(c) ? c : c.data || []);
      }
    } catch {
      toast.error("خطأ في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const createToken = async () => {
    if (!formClientId) { toast.error("اختر عميل"); return; }
    if (formType === "temporary" && !formExpiry) { toast.error("حدد تاريخ الانتهاء"); return; }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/client-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: formClientId,
          type: formType,
          expiresAt: formType === "temporary" ? formExpiry : null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("تم إنشاء اللينك بنجاح");
      setShowForm(false);
      setFormClientId("");
      setFormType("permanent");
      setFormExpiry("");
      loadData();
    } catch {
      toast.error("خطأ في إنشاء اللينك");
    } finally {
      setCreating(false);
    }
  };

  const deactivateToken = async (id: string) => {
    if (!confirm("هل أنت متأكد من تعطيل هذا اللينك؟")) return;
    try {
      const res = await fetch(`/api/admin/client-portal/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("تم تعطيل اللينك");
      loadData();
    } catch {
      toast.error("خطأ في تعطيل اللينك");
    }
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/client/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("تم نسخ اللينك");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeTokens = tokens.filter((t) => t.isActive);
  const inactiveTokens = tokens.filter((t) => !t.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">بوابة العميل</h1>
          <p className="text-muted-foreground text-sm">إدارة لينكات العملاء لمتابعة أوردراتهم</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إنشاء لينك جديد
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">إنشاء لينك جديد</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">العميل</label>
              <select
                value={formClientId}
                onChange={(e) => setFormClientId(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="">اختر عميل...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">النوع</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              >
                <option value="permanent">دائم</option>
                <option value="temporary">مؤقت</option>
              </select>
            </div>
            {formType === "temporary" && (
              <div>
                <label className="text-sm text-muted-foreground block mb-1">ينتهي في</label>
                <input
                  type="datetime-local"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={createToken}
              disabled={creating}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              إنشاء
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-border hover:bg-accent"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Active Tokens */}
      <div>
        <h2 className="text-lg font-semibold mb-3">لينكات فعّالة ({activeTokens.length})</h2>
        {activeTokens.length === 0 ? (
          <div className="bg-card border rounded-xl p-6 text-center text-muted-foreground text-sm">
            لا توجد لينكات فعّالة
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTokens.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.client.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.type === "permanent" ? "دائم" : "مؤقت"}
                        {t.expiresAt && ` — ينتهي: ${new Date(t.expiresAt).toLocaleDateString("ar-EG")}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                    فعّال
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground mb-3 overflow-hidden">
                  <Link2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">/client/{t.token}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyLink(t.token)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    نسخ اللينك
                  </button>
                  <a
                    href={`/client/${t.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    فتح
                  </a>
                  <button
                    onClick={() => deactivateToken(t.id)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30 transition-colors mr-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    تعطيل
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive Tokens */}
      {inactiveTokens.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">لينكات معطّلة ({inactiveTokens.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
            {inactiveTokens.map((t) => (
              <div key={t.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{t.client.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400 mr-auto">
                    معطّل
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
