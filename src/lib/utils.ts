import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("ar-EG").format(num);
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getDaysRemaining(deadline: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);
  const diff = dl.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: "جديد",
    in_progress: "جاري التنفيذ",
    delayed: "متأخر",
    completed: "مكتمل",
    delivered: "تم التسليم",
  };
  return labels[status] || status;
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    delayed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    delivered: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  };
  return colors[status] || "";
}

export function getMachineTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    overlock: "أوفرلوك",
    surger: "أورليه",
    single: "سنجل",
    elastic: "استك لطش",
    press: "مكبس",
    iron: "مكواة",
    cutting: "طربيزة قص",
    packing: "مكان تعبئة",
  };
  return labels[type] || type;
}

export function getMachineStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "شغالة",
    broken: "عطلانة",
    maintenance: "صيانة",
  };
  return labels[status] || status;
}

export function getAttendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    present: "حاضر",
    absent: "غائب",
    late: "متأخر",
    leave: "إجازة",
  };
  return labels[status] || status;
}

export function getPaymentTypeLabel(type: string): string {
  return type === "monthly" ? "شهري" : "أسبوعي";
}

export function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** `ym` = `YYYY-MM` (ISO date prefix). For filtering string `date` fields stored as `YYYY-MM-DD`. */
export function monthDateRange(ym: string): { gte: string; lte: string } {
  const [y, month] = ym.split("-").map(Number);
  const lastDay = new Date(y, month, 0).getDate();
  return {
    gte: `${ym}-01`,
    lte: `${ym}-${String(lastDay).padStart(2, "0")}`,
  };
}
