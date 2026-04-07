import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
  }
}

function setupArabicPDF(title: string): jsPDF {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFontSize(18);
  doc.text(title, doc.internal.pageSize.width / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(
    `نظام إدارة مصنع الملابس - ${new Date().toLocaleDateString("ar-EG")}`,
    doc.internal.pageSize.width / 2,
    28,
    { align: "center" }
  );

  doc.setDrawColor(200);
  doc.line(15, 32, doc.internal.pageSize.width - 15, 32);

  return doc;
}

export function exportPayslipPDF(data: {
  name: string;
  period: string;
  baseSalary: number;
  attendanceBonus: number;
  productionBonus: number;
  totalDeductions: number;
  netSalary: number;
}) {
  const doc = setupArabicPDF("Payslip - كشف مرتب");

  doc.autoTable({
    startY: 38,
    head: [["Item", "Amount"]],
    body: [
      ["Employee / الموظف", data.name],
      ["Period / الفترة", data.period],
      ["Base Salary / الأساسي", String(data.baseSalary)],
      ["Attendance Bonus / بونص انتظام", String(data.attendanceBonus)],
      ["Production Bonus / بونص إنتاج", String(data.productionBonus)],
      ["Deductions / خصومات", String(data.totalDeductions)],
      ["Net Salary / الصافي", String(data.netSalary)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { halign: "center", fontSize: 11 },
  });

  doc.save(`payslip-${data.name}-${data.period}.pdf`);
}

export function exportProductionReportPDF(data: {
  period: string;
  rows: { name: string; total: number; days: number }[];
  grandTotal: number;
}) {
  const doc = setupArabicPDF("Production Report - تقرير إنتاج");

  doc.setFontSize(12);
  doc.text(`Period: ${data.period}`, 15, 38);

  doc.autoTable({
    startY: 44,
    head: [["#", "Employee / الموظف", "Total Pieces / إجمالي القطع", "Working Days / أيام"]],
    body: data.rows.map((r, i) => [String(i + 1), r.name, String(r.total), String(r.days)]),
    foot: [["", "Total / الإجمالي", String(data.grandTotal), ""]],
    theme: "grid",
    headStyles: { fillColor: [34, 197, 94] },
    styles: { halign: "center", fontSize: 10 },
  });

  doc.save(`production-report-${data.period}.pdf`);
}

export function exportOrderInvoicePDF(data: {
  clientName: string;
  orderDescription: string;
  type: string;
  totalQuantity: number;
  unitPrice: number;
  totalValue: number;
  status: string;
  deadline: string;
}) {
  const doc = setupArabicPDF("Invoice - فاتورة أوردر");

  doc.autoTable({
    startY: 38,
    head: [["Item", "Details"]],
    body: [
      ["Client / العميل", data.clientName],
      ["Order / الأوردر", data.orderDescription],
      ["Type / النوع", data.type === "cmt" ? "CMT" : "Full Production"],
      ["Quantity / الكمية", String(data.totalQuantity)],
      ["Unit Price / سعر الوحدة", String(data.unitPrice)],
      ["Total / الإجمالي", String(data.totalValue)],
      ["Status / الحالة", data.status],
      ["Deadline / الموعد", data.deadline],
    ],
    theme: "grid",
    headStyles: { fillColor: [139, 92, 246] },
    styles: { halign: "center", fontSize: 11 },
  });

  doc.save(`invoice-${data.clientName}-${data.orderDescription}.pdf`);
}

export function exportClientStatementPDF(data: {
  clientName: string;
  orders: { description: string; totalQuantity: number; unitPrice: number; totalValue: number; status: string }[];
  totalValue: number;
  deliveredValue: number;
  remainingValue: number;
}) {
  const doc = setupArabicPDF("Client Statement - كشف حساب عميل");

  doc.setFontSize(12);
  doc.text(`Client: ${data.clientName}`, 15, 38);

  doc.autoTable({
    startY: 44,
    head: [["Order / الأوردر", "Qty / الكمية", "Unit Price / سعر", "Total / الإجمالي", "Status / الحالة"]],
    body: data.orders.map((o) => [o.description, String(o.totalQuantity), String(o.unitPrice), String(o.totalValue), o.status]),
    foot: [["Total", "", "", String(data.totalValue), `Remaining: ${data.remainingValue}`]],
    theme: "grid",
    headStyles: { fillColor: [245, 158, 11] },
    styles: { halign: "center", fontSize: 10 },
  });

  doc.save(`statement-${data.clientName}.pdf`);
}

export function exportFinanceReportPDF(data: {
  title: string;
  period: string;
  rows: { label: string; amount: number }[];
  totalExpenses: number;
  totalRevenues: number;
  netProfit: number;
}) {
  const doc = setupArabicPDF(data.title);

  doc.setFontSize(12);
  doc.text(`Period: ${data.period}`, 15, 38);

  doc.autoTable({
    startY: 44,
    head: [["Category / البند", "Amount / المبلغ"]],
    body: data.rows.map((r) => [r.label, String(r.amount)]),
    foot: [
      ["Total Expenses / إجمالي المصروفات", String(data.totalExpenses)],
      ["Total Revenues / إجمالي الإيرادات", String(data.totalRevenues)],
      ["Net Profit / صافي الربح", String(data.netProfit)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { halign: "center", fontSize: 10 },
  });

  doc.save(`finance-report-${data.period}.pdf`);
}
