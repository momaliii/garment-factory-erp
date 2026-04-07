"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Plus, Edit, XCircle, Loader2 } from "lucide-react";

interface ExpCat { id: string; name: string; type: string; isActive: boolean; _count: { expenses: number }; }
interface RevCat { id: string; name: string; isActive: boolean; _count: { revenues: number }; }

export default function CategoriesPage() {
  const [expCats, setExpCats] = useState<ExpCat[]>([]);
  const [revCats, setRevCats] = useState<RevCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newExpName, setNewExpName] = useState("");
  const [newExpType, setNewExpType] = useState("variable");
  const [newRevName, setNewRevName] = useState("");
  const [editExpId, setEditExpId] = useState<string | null>(null);
  const [editExpName, setEditExpName] = useState("");
  const [editRevId, setEditRevId] = useState<string | null>(null);
  const [editRevName, setEditRevName] = useState("");

  const load = useCallback(async () => {
    try {
      const [eRes, rRes] = await Promise.all([
        fetch("/api/finance/expense-categories"),
        fetch("/api/finance/revenue-categories"),
      ]);
      if (eRes.ok) setExpCats(await eRes.json());
      if (rRes.ok) setRevCats(await rRes.json());
    } catch { toast.error("خطأ في تحميل البيانات"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addExpCat = async () => {
    if (!newExpName.trim()) return;
    try {
      const res = await fetch("/api/finance/expense-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newExpName, type: newExpType }) });
      if (!res.ok) throw new Error();
      toast.success("تم إضافة البند");
      setNewExpName("");
      load();
    } catch { toast.error("خطأ"); }
  };

  const addRevCat = async () => {
    if (!newRevName.trim()) return;
    try {
      const res = await fetch("/api/finance/revenue-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newRevName }) });
      if (!res.ok) throw new Error();
      toast.success("تم إضافة البند");
      setNewRevName("");
      load();
    } catch { toast.error("خطأ"); }
  };

  const updateExpCat = async (id: string, data: Record<string, unknown>) => {
    try {
      await fetch(`/api/finance/expense-categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      toast.success("تم التعديل");
      setEditExpId(null);
      load();
    } catch { toast.error("خطأ"); }
  };

  const updateRevCat = async (id: string, data: Record<string, unknown>) => {
    try {
      await fetch(`/api/finance/revenue-categories/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      toast.success("تم التعديل");
      setEditRevId(null);
      load();
    } catch { toast.error("خطأ"); }
  };

  const toggleExpActive = async (cat: ExpCat) => {
    await updateExpCat(cat.id, { isActive: !cat.isActive });
  };

  const toggleRevActive = async (cat: RevCat) => {
    await updateRevCat(cat.id, { isActive: !cat.isActive });
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">إدارة البنود</h1>
        <p className="text-muted-foreground text-sm">بنود المصروفات والإيرادات</p>
      </div>

      {/* Expense Categories */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">بنود المصروفات</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" value={newExpName} onChange={(e) => setNewExpName(e.target.value)} placeholder="اسم البند..." className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" onKeyDown={(e) => e.key === "Enter" && addExpCat()} />
          <select value={newExpType} onChange={(e) => setNewExpType(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-background">
            <option value="fixed">ثابت</option>
            <option value="variable">متغير</option>
          </select>
          <button onClick={addExpCat} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {expCats.map((cat) => (
            <div key={cat.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cat.isActive ? "" : "opacity-50 bg-muted/30"}`}>
              {editExpId === cat.id ? (
                <>
                  <input type="text" value={editExpName} onChange={(e) => setEditExpName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm bg-background" onKeyDown={(e) => e.key === "Enter" && updateExpCat(cat.id, { name: editExpName })} />
                  <button onClick={() => updateExpCat(cat.id, { name: editExpName })} className="text-xs text-primary">حفظ</button>
                  <button onClick={() => setEditExpId(null)} className="text-xs text-muted-foreground">إلغاء</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">{cat.type === "fixed" ? "ثابت" : "متغير"}</span>
                  <span className="text-xs text-muted-foreground">{cat._count.expenses} مصروف</span>
                  <button onClick={() => { setEditExpId(cat.id); setEditExpName(cat.name); }} className="p-1 rounded hover:bg-accent"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggleExpActive(cat)} className="p-1 rounded hover:bg-accent"><XCircle className={`w-3.5 h-3.5 ${cat.isActive ? "text-red-500" : "text-green-500"}`} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Revenue Categories */}
      <div className="bg-card border rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">بنود الإيرادات</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" value={newRevName} onChange={(e) => setNewRevName(e.target.value)} placeholder="اسم البند..." className="flex-1 border rounded-lg px-3 py-2 text-sm bg-background" onKeyDown={(e) => e.key === "Enter" && addRevCat()} />
          <button onClick={addRevCat} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {revCats.map((cat) => (
            <div key={cat.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${cat.isActive ? "" : "opacity-50 bg-muted/30"}`}>
              {editRevId === cat.id ? (
                <>
                  <input type="text" value={editRevName} onChange={(e) => setEditRevName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm bg-background" onKeyDown={(e) => e.key === "Enter" && updateRevCat(cat.id, { name: editRevName })} />
                  <button onClick={() => updateRevCat(cat.id, { name: editRevName })} className="text-xs text-primary">حفظ</button>
                  <button onClick={() => setEditRevId(null)} className="text-xs text-muted-foreground">إلغاء</button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat._count.revenues} إيراد</span>
                  <button onClick={() => { setEditRevId(cat.id); setEditRevName(cat.name); }} className="p-1 rounded hover:bg-accent"><Edit className="w-3.5 h-3.5" /></button>
                  <button onClick={() => toggleRevActive(cat)} className="p-1 rounded hover:bg-accent"><XCircle className={`w-3.5 h-3.5 ${cat.isActive ? "text-red-500" : "text-green-500"}`} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
