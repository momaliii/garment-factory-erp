"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useMemo } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  searchable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchPlaceholder = "بحث...",
  emptyMessage = "لا توجد بيانات",
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search) return data;
    const searchLower = search.toLowerCase();
    return data.filter((item) =>
      columns.some((col) => {
        if (col.searchable === false) return false;
        const val = item[col.key];
        return val != null && String(val).toLowerCase().includes(searchLower);
      })
    );
  }, [data, search, columns]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 text-right font-medium text-muted-foreground"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredData.map((item, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b last:border-0 transition-colors hover:bg-muted/50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(item) : (item[col.key] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
