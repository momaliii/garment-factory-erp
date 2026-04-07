"use client";

import { Moon, Sun, Menu, Bell, Check } from "lucide-react";
import { useTheme } from "@/components/layout/theme-provider";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useRef } from "react";
import { CommandSearch } from "@/components/shared/command-search";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      loadNotifications();
    } catch { /* ignore */ }
  };

  const typeColors: Record<string, string> = {
    warning: "bg-amber-500",
    error: "bg-red-500",
    success: "bg-green-500",
    info: "bg-blue-500",
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4 md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center justify-center" id="global-search">
          <CommandSearch />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef} id="notifications-bell">
            <Button variant="ghost" size="icon" onClick={() => setShowNotif(!showNotif)} className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {showNotif && (
              <div className="absolute left-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h3 className="font-semibold text-sm">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Check className="w-3 h-3" /> تحديد الكل كمقروء
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">لا توجد إشعارات</p>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}>
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${typeColors[n.type] || typeColors.info}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.isRead ? "font-semibold" : ""}`}>{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {new Date(n.createdAt).toLocaleDateString("ar-EG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button
            id="theme-toggle"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
