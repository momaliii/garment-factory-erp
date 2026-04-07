import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const BACKUPS_DIR = path.resolve(process.cwd(), "backups");
const SETTINGS_PATH = path.join(BACKUPS_DIR, "_settings.json");

export interface BackupInfo {
  filename: string;
  size: number;
  createdAt: string;
  type: "manual" | "auto";
  label?: string;
}

export interface BackupSettings {
  enabled: boolean;
  schedule: "daily" | "weekly";
  time: string;
  dayOfWeek?: number;
  maxBackups: number;
  lastBackup?: string;
}

const DEFAULT_SETTINGS: BackupSettings = {
  enabled: false,
  schedule: "daily",
  time: "02:00",
  dayOfWeek: 6,
  maxBackups: 30,
};

function ensureBackupDir() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  }
}

export function getBackupSettings(): BackupSettings {
  ensureBackupDir();
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveBackupSettings(settings: BackupSettings) {
  ensureBackupDir();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

async function exportAllData() {
  const [
    users,
    roles,
    guestLinks,
    employees,
    machines,
    attendance,
    dailyProduction,
    payrollRecords,
    deductions,
    clients,
    clientPortalTokens,
    orders,
    orderProgress,
    fabricReceiving,
    notifications,
    auditLogs,
    inventoryItems,
    inventoryTransactions,
    productionStages,
    expenseCategories,
    expenses,
    revenueCategories,
    revenues,
    bonusSettings,
    webhookEndpoints,
    webhookLogs,
    apiKeys,
    aiConversations,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.role.findMany(),
    prisma.guestLink.findMany(),
    prisma.employee.findMany(),
    prisma.machine.findMany(),
    prisma.attendance.findMany(),
    prisma.dailyProduction.findMany(),
    prisma.payrollRecord.findMany(),
    prisma.deduction.findMany(),
    prisma.client.findMany(),
    prisma.clientPortalToken.findMany(),
    prisma.order.findMany(),
    prisma.orderProgress.findMany(),
    prisma.fabricReceiving.findMany(),
    prisma.notification.findMany(),
    prisma.auditLog.findMany(),
    prisma.inventoryItem.findMany(),
    prisma.inventoryTransaction.findMany(),
    prisma.productionStage.findMany(),
    prisma.expenseCategory.findMany(),
    prisma.expense.findMany(),
    prisma.revenueCategory.findMany(),
    prisma.revenue.findMany(),
    prisma.bonusSettings.findMany(),
    prisma.webhookEndpoint.findMany(),
    prisma.webhookLog.findMany(),
    prisma.apiKey.findMany(),
    prisma.aiConversation.findMany(),
  ]);

  return {
    _meta: { version: 1, exportedAt: new Date().toISOString(), engine: "mysql" },
    roles,
    users,
    guestLinks,
    employees,
    machines,
    attendance,
    dailyProduction,
    payrollRecords,
    deductions,
    clients,
    clientPortalTokens,
    orders,
    orderProgress,
    fabricReceiving,
    notifications,
    auditLogs,
    inventoryItems,
    inventoryTransactions,
    productionStages,
    expenseCategories,
    expenses,
    revenueCategories,
    revenues,
    bonusSettings,
    webhookEndpoints,
    webhookLogs,
    apiKeys,
    aiConversations,
  };
}

export async function createBackup(
  type: "manual" | "auto" = "manual",
  label?: string
): Promise<BackupInfo> {
  ensureBackupDir();

  const now = new Date();
  const timestamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  const filename = `backup_${type}_${timestamp}.json`;
  const destPath = path.join(BACKUPS_DIR, filename);

  const data = await exportAllData();
  fs.writeFileSync(destPath, JSON.stringify(data));

  const stats = fs.statSync(destPath);

  const settings = getBackupSettings();
  settings.lastBackup = now.toISOString();
  saveBackupSettings(settings);

  cleanOldBackups();

  return {
    filename,
    size: stats.size,
    createdAt: now.toISOString(),
    type,
    label,
  };
}

export function listBackups(): BackupInfo[] {
  ensureBackupDir();

  const files = fs
    .readdirSync(BACKUPS_DIR)
    .filter((f) => f.endsWith(".json") && f.startsWith("backup_"));

  return files
    .map((filename) => {
      const filePath = path.join(BACKUPS_DIR, filename);
      const stats = fs.statSync(filePath);
      const type = filename.includes("_auto_") ? "auto" : "manual";
      return {
        filename,
        size: stats.size,
        createdAt: stats.mtime.toISOString(),
        type: type as "manual" | "auto",
      };
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export async function restoreBackup(filename: string): Promise<void> {
  ensureBackupDir();

  const backupPath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(backupPath)) {
    throw new Error("ملف النسخة الاحتياطية غير موجود");
  }

  if (!filename.endsWith(".json")) {
    throw new Error("ملف غير صالح");
  }

  await createBackup("auto", "pre-restore");

  const raw = fs.readFileSync(backupPath, "utf-8");
  const data = JSON.parse(raw);

  // Delete in reverse dependency order
  await prisma.webhookLog.deleteMany();
  await prisma.webhookEndpoint.deleteMany();
  await prisma.aiConversation.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.productionStage.deleteMany();
  await prisma.revenue.deleteMany();
  await prisma.revenueCategory.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.fabricReceiving.deleteMany();
  await prisma.orderProgress.deleteMany();
  await prisma.dailyProduction.deleteMany();
  await prisma.deduction.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.clientPortalToken.deleteMany();
  await prisma.order.deleteMany();
  await prisma.client.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.bonusSettings.deleteMany();
  await prisma.guestLink.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // Reinsert in dependency order
  if (data.roles?.length) {
    for (const r of data.roles) await prisma.role.create({ data: r });
  }
  if (data.users?.length) {
    for (const u of data.users) await prisma.user.create({ data: u });
  }
  if (data.guestLinks?.length) {
    for (const g of data.guestLinks) await prisma.guestLink.create({ data: g });
  }
  if (data.machines?.length) {
    for (const m of data.machines) await prisma.machine.create({ data: m });
  }
  if (data.employees?.length) {
    for (const e of data.employees) await prisma.employee.create({ data: e });
  }
  if (data.clients?.length) {
    for (const c of data.clients) await prisma.client.create({ data: c });
  }
  if (data.clientPortalTokens?.length) {
    for (const t of data.clientPortalTokens) await prisma.clientPortalToken.create({ data: t });
  }
  if (data.orders?.length) {
    for (const o of data.orders) await prisma.order.create({ data: o });
  }
  if (data.orderProgress?.length) {
    for (const p of data.orderProgress) await prisma.orderProgress.create({ data: p });
  }
  if (data.fabricReceiving?.length) {
    for (const f of data.fabricReceiving) await prisma.fabricReceiving.create({ data: f });
  }
  if (data.attendance?.length) {
    for (const a of data.attendance) await prisma.attendance.create({ data: a });
  }
  if (data.dailyProduction?.length) {
    for (const d of data.dailyProduction) await prisma.dailyProduction.create({ data: d });
  }
  if (data.payrollRecords?.length) {
    for (const p of data.payrollRecords) await prisma.payrollRecord.create({ data: p });
  }
  if (data.deductions?.length) {
    for (const d of data.deductions) await prisma.deduction.create({ data: d });
  }
  if (data.bonusSettings?.length) {
    for (const b of data.bonusSettings) await prisma.bonusSettings.create({ data: b });
  }
  if (data.expenseCategories?.length) {
    for (const c of data.expenseCategories) await prisma.expenseCategory.create({ data: c });
  }
  if (data.expenses?.length) {
    for (const e of data.expenses) await prisma.expense.create({ data: e });
  }
  if (data.revenueCategories?.length) {
    for (const c of data.revenueCategories) await prisma.revenueCategory.create({ data: c });
  }
  if (data.revenues?.length) {
    for (const r of data.revenues) await prisma.revenue.create({ data: r });
  }
  if (data.inventoryItems?.length) {
    for (const i of data.inventoryItems) await prisma.inventoryItem.create({ data: i });
  }
  if (data.inventoryTransactions?.length) {
    for (const t of data.inventoryTransactions) await prisma.inventoryTransaction.create({ data: t });
  }
  if (data.productionStages?.length) {
    for (const s of data.productionStages) await prisma.productionStage.create({ data: s });
  }
  if (data.notifications?.length) {
    for (const n of data.notifications) await prisma.notification.create({ data: n });
  }
  if (data.auditLogs?.length) {
    for (const a of data.auditLogs) await prisma.auditLog.create({ data: a });
  }
  if (data.webhookEndpoints?.length) {
    for (const w of data.webhookEndpoints) await prisma.webhookEndpoint.create({ data: w });
  }
  if (data.webhookLogs?.length) {
    for (const l of data.webhookLogs) await prisma.webhookLog.create({ data: l });
  }
  if (data.apiKeys?.length) {
    for (const k of data.apiKeys) await prisma.apiKey.create({ data: k });
  }
  if (data.aiConversations?.length) {
    for (const c of data.aiConversations) await prisma.aiConversation.create({ data: c });
  }
}

export function deleteBackup(filename: string): void {
  ensureBackupDir();

  const backupPath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(backupPath)) {
    throw new Error("ملف النسخة الاحتياطية غير موجود");
  }

  fs.unlinkSync(backupPath);
}

export function getBackupPath(filename: string): string | null {
  const backupPath = path.join(BACKUPS_DIR, filename);
  if (fs.existsSync(backupPath) && filename.endsWith(".json")) {
    return backupPath;
  }
  return null;
}

function cleanOldBackups() {
  const settings = getBackupSettings();
  const backups = listBackups();

  if (backups.length > settings.maxBackups) {
    const toDelete = backups.slice(settings.maxBackups);
    for (const b of toDelete) {
      try {
        fs.unlinkSync(path.join(BACKUPS_DIR, b.filename));
      } catch {
        // ignore
      }
    }
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
