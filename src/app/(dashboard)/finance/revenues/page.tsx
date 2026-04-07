"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";

interface Category { id: string; name: string; }
interface RevenueItem {
  id: string;
  categoryId: string;
  amount: number;
  description: string | null;
  date: string;
  orderId: string | null;
  category: { name: string };
  order: { id: string; description: string | null } | null;
}

function formatCurrency(v: number) {
  return v.toLocaleString("ar-EG", { minimumFractionDigits: 0 });
}

export default function RevenuesPage() {
  const [revenues, setRevenues] = useState<RevenueItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ categoryId: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10), orderId: "" });
  const [filterCat, setFilterCat] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterFrom) params.set("from", filterFrom);
      if (filterTo) params.set("to", filterTo);
      if (filterCat) params.set("categoryId", filterCat);

      const [rRes, cRes] = await Promise.all([
        fetch(`/api/finance/revenues?${params}`),
        fetch("/api/finance/revenue-categories"),
      ]);
      if (rRes.ok) setRevenues(await rRes.json());
      if (cRes.ok) {
        const cats = await cRes.json();
        setCategories(cats.filter((c: Category & { isActive: boolean }) => c.isActive));
      }
    } catch { toast.error("خطأ في تحميل البيانات"); }
    finally { setLoading(false); }
  }, [filterCat, filterFrom, filterTo]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.categoryId || !form.amount || !form.date) { toast.error("جميع الحقول مطلوبة"); return; }
    try {
      const url = editId ? `/api/finance/revenues/${editId}` : "/api/finance/revenues";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(editId ? "تم التعديل" : "تم الإضافة");
      setShowForm(false);
      setEditId(null);
      setForm({ categoryId: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10), orderId: "" });
      load();
    } catch { toast.error("خطأ في الحفظ"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف هذا الإيراد؟")) return;
    try {
      await fetch(`/api/finance/revenues/${id}`, { method: "DELETE" });
      toast.success("تم الحذف");
      load();
    } catch { toast.error("خطأ في الحذف"); }
  };

  const startEdit = (r: RevenueItem) => {
    setEditId(r.id);
    setForm({ categoryId: r.categoryId, amount: String(r.amount), description: r.description || "", date: r.date, orderId: r.orderId || "" });
    setShowForm(true);
  };

  const total = revenues.reduce((s, r) => s + r.amount, 0);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">الإيرادات</h1>
          <p className="text-muted-foreground text-sm">إجمالي المُصفّى: {formatCurrency(total)} جنيه</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ categoryId: "", amount: "", description: "", date: new Date().toISOString().slice(0, 10), orderId: "" }); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> إضافة إيراد
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-4 flex flex-wrap gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">البند</label>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background">
            <option value="">الكل</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">من</label>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">إلى</label>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm bg-background" />
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editId ? "تعديل إيراد" : "إضافة إيراد"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-1">البند</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
                <option value="">اختر...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">المبلغ</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="0" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">التاريخ</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground block mb-1">الوصف</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" placeholder="ملاحظات..." />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">{editId ? "تعديل" : "إضافة"}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 rounded-lg text-sm border hover:bg-accent">إلغاء</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 text-muted-foreground text-xs border-b">
                <th className="text-right py-2.5 px-4">التاريخ</th>
                <th className="text-right py-2.5 px-4">البند</th>
                <th className="text-right py-2.5 px-4">المبلغ</th>
                <th className="text-right py-2.5 px-4">الوصف</th>
                <th className="text-right py-2.5 px-4">الأوردر</th>
                <th className="text-right py-2.5 px-4">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {revenues.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="py-2.5 px-4">{r.date}</td>
                  <td className="py-2.5 px-4">{r.category.name}</td>
                  <td className="py-2.5 px-4 font-semibold text-green-600">{formatCurrency(r.amount)}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{r.description || "—"}</td>
                  <td className="py-2.5 px-4 text-muted-foreground">{r.order?.description || "—"}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(r)} className="p-1.5 rounded hover:bg-accent"><Edit className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {revenues.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">لا توجد إيرادات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
