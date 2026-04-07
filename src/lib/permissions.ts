export type PermissionValue = boolean | "full" | "read";
export type Permissions = Record<string, PermissionValue>;

export const PERMISSION_MODULES = [
  { key: "dashboard", label: "لوحة التحكم" },
  { key: "employees", label: "الموظفين" },
  { key: "attendance", label: "الحضور والانصراف" },
  { key: "production", label: "تتبع الانتاج" },
  { key: "payroll", label: "المرتبات" },
  { key: "clients", label: "العملاء" },
  { key: "orders", label: "الأوردرات" },
  { key: "machines", label: "المعدات" },
  { key: "reports", label: "التقارير" },
  { key: "ai", label: "المساعد الذكي" },
  { key: "settings", label: "الإعدادات" },
  { key: "inventory", label: "المخزون" },
  { key: "finance", label: "المحاسبة" },
  { key: "admin", label: "إدارة النظام" },
  { key: "guest_links", label: "لينكات مؤقتة" },
] as const;

export function hasAccess(permissions: Permissions, module: string): boolean {
  const value = permissions[module];
  return !!value;
}

export function canWrite(permissions: Permissions, module: string): boolean {
  const value = permissions[module];
  return value === true || value === "full";
}

export function canRead(permissions: Permissions, module: string): boolean {
  return hasAccess(permissions, module);
}

export function parsePermissions(str: string): Permissions {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

const ALL_TRUE: Permissions = {
  dashboard: true,
  employees: true,
  attendance: true,
  production: true,
  payroll: true,
  clients: true,
  orders: true,
  machines: true,
  reports: true,
  ai: true,
  settings: true,
  inventory: true,
  finance: true,
  admin: true,
  guest_links: true,
};

export const SYSTEM_ROLES: Record<string, Permissions> = {
  owner: { ...ALL_TRUE },
  developer: { ...ALL_TRUE },
  production_manager: {
    dashboard: true,
    production: "full",
    orders: "full",
    machines: "full",
    reports: true,
  },
  hr: {
    dashboard: true,
    employees: "full",
    attendance: "full",
    payroll: "full",
    reports: true,
    finance: "read",
  },
  quality_manager: {
    dashboard: true,
    production: "read",
    orders: "read",
    reports: true,
  },
  worker: {
    dashboard: "read",
    production: "read",
    payroll: "read",
  },
};
