"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { hasAccess, type Permissions } from "@/lib/permissions";
import {
  LayoutDashboard,
  Users,
  Clock,
  Factory,
  Banknote,
  UserCircle,
  ClipboardList,
  Wrench,
  BarChart3,
  Settings,
  Bot,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Shield,
  UserCog,
  Link2,
  LogOut,
  HardDrive,
  Wallet,
  Package,
  Layers,
  FileText,
  User,
  HelpCircle,
} from "lucide-react";
import { useState, useEffect } from "react";

const navigation = [
  { name: "لوحة التحكم", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { name: "الموظفين", href: "/employees", icon: Users, module: "employees" },
  { name: "الحضور والانصراف", href: "/attendance", icon: Clock, module: "attendance" },
  { name: "تتبع الانتاج", href: "/production", icon: Factory, module: "production" },
  { name: "المرتبات", href: "/payroll", icon: Banknote, module: "payroll" },
  { name: "العملاء", href: "/clients", icon: UserCircle, module: "clients" },
  { name: "الأوردرات", href: "/orders", icon: ClipboardList, module: "orders" },
  { name: "مراحل الإنتاج", href: "/production-stages", icon: Layers, module: "production" },
  { name: "المعدات", href: "/machines", icon: Wrench, module: "machines" },
  { name: "المخزون", href: "/inventory", icon: Package, module: "inventory" },
  { name: "المحاسبة", href: "/finance", icon: Wallet, module: "finance" },
  { name: "التقارير", href: "/reports", icon: BarChart3, module: "reports" },
  { name: "بياناتي", href: "/my-portal", icon: User, module: "dashboard" },
  { name: "المساعد الذكي", href: "/ai", icon: Bot, module: "ai" },
  { name: "الإعدادات", href: "/settings", icon: Settings, module: "settings" },
  { name: "دليل الاستخدام", href: "/help", icon: HelpCircle, module: "dashboard" },
];

const adminNavigation = [
  { name: "إدارة الأدوار", href: "/admin/roles", icon: Shield, module: "admin" },
  { name: "إدارة المستخدمين", href: "/admin/users", icon: UserCog, module: "admin" },
  { name: "لينكات مؤقتة", href: "/admin/guest-links", icon: Link2, module: "guest_links" },
  { name: "النسخ الاحتياطي", href: "/admin/backups", icon: HardDrive, module: "admin" },
  { name: "بوابة العميل", href: "/admin/client-portal", icon: Link2, module: "clients" },
  { name: "سجل التغييرات", href: "/admin/audit-log", icon: FileText, module: "admin" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const permissions = (session?.user?.permissions || {}) as Permissions;

  const filteredNav = navigation.filter((item) => hasAccess(permissions, item.module));
  const filteredAdmin = adminNavigation.filter((item) => hasAccess(permissions, item.module));

  const userName = session?.user?.name || "";
  const userRole = (session?.user as { role?: string })?.role || "";
  const userInitial = userName.charAt(0) || "?";

  return (
    <>
    <aside
      className={cn(
        "fixed top-0 right-0 z-40 h-screen bg-sidebar border-l transition-all duration-300 flex flex-col",
        collapsed ? "w-[70px]" : "w-[260px]",
        "max-md:w-[260px]",
        mobileOpen ? "max-md:translate-x-0" : "max-md:translate-x-full"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-base">مصنع الملابس</h1>
              <p className="text-xs text-muted-foreground">نظام الإدارة</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center mx-auto">
            <Scissors className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
      </div>

      <nav id="sidebar-nav" className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredNav.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const sidebarId = `sidebar-${item.href.replace(/\//g, "").replace(/-/g, "")}`;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={sidebarId}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {filteredAdmin.length > 0 && (
          <>
            <div className="pt-3 pb-1">
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-muted-foreground tracking-wide">
                  إدارة
                </p>
              )}
              <div className="mt-1 border-t" />
            </div>
            {filteredAdmin.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {session?.user && (
        <div className={cn("border-t p-3", collapsed ? "flex flex-col items-center gap-2" : "")}>
          <div
            className={cn(
              "flex items-center",
              collapsed ? "flex-col gap-2" : "gap-3"
            )}
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
              {userInitial}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userName}</p>
                {userRole && (
                  <p className="text-xs text-muted-foreground truncate">{userRole}</p>
                )}
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={cn(
                "shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
                collapsed && "mt-1"
              )}
              title="تسجيل الخروج"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t hover:bg-accent transition-colors flex items-center justify-center"
      >
        {collapsed ? (
          <ChevronLeft className="h-5 w-5" />
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
      </button>
    </aside>

    {mounted && (
      <>
        {mobileOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
        )}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 right-4 z-50 md:hidden p-2 bg-card border rounded-lg shadow-sm"
        >
          <Scissors className="h-5 w-5 text-primary" />
        </button>
      </>
    )}
    </>
  );
}
