"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, Users, UserCircle, ClipboardList, Wrench, X } from "lucide-react";

interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  employee: Users,
  client: UserCircle,
  order: ClipboardList,
  machine: Wrench,
};

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 300);
    return () => clearTimeout(timeout);
  }, [query, search]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">بحث...</span>
        <kbd className="hidden md:inline text-[10px] bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-10">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="ابحث عن موظف، عميل، أوردر، معدات..."
              className="flex-1 h-12 bg-transparent text-sm outline-none px-3 placeholder:text-muted-foreground"
              autoFocus
            />
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-accent">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-2">
            {loading && <Command.Loading><p className="text-sm text-muted-foreground text-center py-4">جاري البحث...</p></Command.Loading>}
            {!loading && query.length >= 2 && results.length === 0 && (
              <Command.Empty className="text-sm text-muted-foreground text-center py-6">لا توجد نتائج</Command.Empty>
            )}
            {results.map((r) => {
              const Icon = TYPE_ICONS[r.type] || Search;
              return (
                <Command.Item
                  key={`${r.type}-${r.id}`}
                  onSelect={() => { router.push(r.href); setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-sm hover:bg-accent transition-colors"
                >
                  <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.subtitle}</p>
                  </div>
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
