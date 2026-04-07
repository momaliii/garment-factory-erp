"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit, Loader2, AlertTriangle, ArrowDown, ArrowUp, Package } from "lucide-react";

interface InvItem {
  id: string; name: string; type: string; quantity: number; unit: string;
  minStock: number; cost: number; isActive: boolean; _count: { transactions: number };
}

const TYPE_LABELS: Record<string, string> = {
  fabric: "قماش", thread: "خيط", button: "أزرار", label: "تيكت", packaging: "تغليف", other: "أخرى",
};
const UNIT_LABELS: Record<string, string> = { unit: "وحدة", meter: "متر", kg: "كجم", roll: "رول" };

export default function InventoryPage() {
  const [items, setItems] = useState<InvItem[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showTxForm, setShowTxForm] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", type: "fabric", quantity: "0", unit: "meter", minStock: "0", cost: "0" });
  const [txForm, setTxForm] = useState({ type: "in", quantity: "", notes: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setLowStockCount(data.lowStockCount || 0);
      }
    } catch { toast.error("خطأ في تحميل البيانات"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name) { toast.error("الاسم مطلوب"); return; }
    try {
      const url = editId ? `/api/inventory/${editId}` : "/api/inventory";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error();
      toast.success(editId ? "تم التعديل" : "تم الإضافة");
      setShowForm(false); setEditId(null);
      setForm({ name: "", type: "fabric", quantity: "0", unit: "meter", minStock: "0", cost: "0" });
      load();
    } catch { toast.error("خطأ في الحفظ"); }
  };

  const addTransaction = async (itemId: string) => {
    if (!txForm.quantity) { toast.error("الكمية مطلوبة"); return; }
    try {
      const res = await fetch("/api/inventory/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, ...txForm }),
      });
      if (!res.ok) throw new Error();
      toast.success(txForm.type === "in" ? "تم الإضافة للمخزون" : "تم الصرف من المخزون");
      setShowTxForm(null); setTxForm({ type: "in", quantity: "", notes: "" });
      load();
    } catch { toast.error("خطأ"); }
  };

  const deactivate = async (id: string) => {
    if (!confirm("تعطيل هذا الصنف؟")) return;
    try { await fetch(`/api/inventory/${id}`, { method: "DELETE" }); toast.success("تم"); load(); }
    catch { toast.error("خطأ"); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  const activeItems = items.filter((i) => i.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">المخزون</h1>
          <p className="text-muted-foreground text-sm">
            {activeItems.length} صنف
            {lowStockCount > 0 && <span className="text-red-500 mr-2">• {lowStockCount} تحت الحد الأدنى</span>}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: "", type: "fabric", quantity: "0", unit: "meter", minStock: "0", cost: "0" }); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> إضافة صنف
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold">{editId ? "تعديل صنف" : "إضافة صنف"}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-sm text-muted-foreground block mb-1">الاسم</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">النوع</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            <div><label className="text-sm text-muted-foreground block mb-1">الوحدة</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background">
                {Object.entries(UNIT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select></div>
            {!editId && <div><label className="text-sm text-muted-foreground block mb-1">الكمية</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" /></div>}
            <div><label className="text-sm text-muted-foreground block mb-1">حد أدنى</label><input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" /></div>
            <div><label className="text-sm text-muted-foreground block mb-1">التكلفة</label><input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm bg-background" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">{editId ? "تعديل" : "إضافة"}</button>
            <button onClick={() => { setShowForm(false); setEditId(null); }} className="px-4 py-2 rounded-lg text-sm border hover:bg-accent">إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeItems.map((item) => {
          const isLow = item.minStock > 0 && item.quantity <= item.minStock;
          return (
            <div key={item.id} className={`bg-card border rounded-xl p-4 ${isLow ? "border-red-300 dark:border-red-800" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isLow ? "bg-red-100 text-red-600 dark:bg-red-950/40" : "bg-primary/10 text-primary"}`}>
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{TYPE_LABELS[item.type] || item.type}</p>
                  </div>
                </div>
                {isLow && <AlertTriangle className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-2xl font-bold ${isLow ? "text-red-600" : ""}`}>{item.quantity}</span>
                <span className="text-sm text-muted-foreground">{UNIT_LABELS[item.unit]}</span>
              </div>
              {item.minStock > 0 && <p className="text-xs text-muted-foreground mb-3">حد أدنى: {item.minStock}</p>}

              {showTxForm === item.id ? (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <div className="flex gap-2">
                    <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })} className="border rounded px-2 py-1 text-sm bg-background">
                      <option value="in">إضافة (وارد)</option>
                      <option value="out">صرف (صادر)</option>
                    </select>
                    <input type="number" value={txForm.quantity} onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })} placeholder="الكمية" className="flex-1 border rounded px-2 py-1 text-sm bg-background" />
                  </div>
                  <input value={txForm.notes} onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })} placeholder="ملاحظات..." className="w-full border rounded px-2 py-1 text-sm bg-background" />
                  <div className="flex gap-1">
                    <button onClick={() => addTransaction(item.id)} className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs">حفظ</button>
                    <button onClick={() => setShowTxForm(null)} className="px-3 py-1 rounded text-xs border">إلغاء</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1 mt-2">
                  <button onClick={() => { setShowTxForm(item.id); setTxForm({ type: "in", quantity: "", notes: "" }); }} className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-accent">
                    <ArrowDown className="w-3 h-3 text-green-500" />وارد
                  </button>
                  <button onClick={() => { setShowTxForm(item.id); setTxForm({ type: "out", quantity: "", notes: "" }); }} className="flex items-center gap-1 text-xs px-2 py-1 rounded border hover:bg-accent">
                    <ArrowUp className="w-3 h-3 text-red-500" />صادر
                  </button>
                  <button onClick={() => { setEditId(item.id); setForm({ name: item.name, type: item.type, quantity: String(item.quantity), unit: item.unit, minStock: String(item.minStock), cost: String(item.cost) }); setShowForm(true); }} className="p-1 rounded hover:bg-accent mr-auto"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deactivate(item.id)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {activeItems.length === 0 && <div className="bg-card border rounded-xl p-8 text-center text-muted-foreground">لا توجد أصناف في المخزون</div>}
    </div>
  );
}
