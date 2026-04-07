import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getCurrentMonth } from "@/lib/utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function getFactoryContext(): Promise<string> {
  const month = getCurrentMonth();
  const today = new Date().toISOString().split("T")[0];

  const [
    employeeCount,
    activeEmployees,
    todayAttendance,
    monthProduction,
    activeOrders,
    recentPayroll,
  ] = await Promise.all([
    prisma.employee.count({ where: { isActive: true } }),
    prisma.employee.findMany({
      where: { isActive: true },
      select: { id: true, name: true, role: true, baseSalary: true, paymentType: true },
    }),
    prisma.attendance.findMany({
      where: { date: today },
      include: { employee: { select: { name: true } } },
    }),
    prisma.dailyProduction.findMany({
      where: { date: { startsWith: month } },
      include: { employee: { select: { name: true } } },
    }),
    prisma.order.findMany({
      where: { status: { in: ["new", "in_progress", "delayed"] } },
      include: {
        client: { select: { name: true } },
        orderProgress: true,
      },
    }),
    prisma.payrollRecord.findMany({
      where: { period: month },
      include: { employee: { select: { name: true } } },
    }),
  ]);

  const productionByEmployee = new Map<string, { name: string; total: number; days: Set<string> }>();
  for (const p of monthProduction) {
    const existing = productionByEmployee.get(p.employeeId) || { name: p.employee.name, total: 0, days: new Set<string>() };
    existing.total += p.quantity;
    existing.days.add(p.date);
    productionByEmployee.set(p.employeeId, existing);
  }

  const productionSummary = Array.from(productionByEmployee.values())
    .sort((a, b) => b.total - a.total)
    .map((p) => `${p.name}: ${p.total} قطعة في ${p.days.size} يوم`)
    .join("\n");

  const presentToday = todayAttendance.filter((a) => a.status === "present").length;
  const absentToday = todayAttendance.filter((a) => a.status === "absent").length;
  const lateToday = todayAttendance.filter((a) => a.status === "late").length;

  const ordersSummary = activeOrders.map((o) => {
    const produced = o.orderProgress.reduce((s, p) => s + p.produced, 0);
    const delivered = o.orderProgress.reduce((s, p) => s + p.delivered, 0);
    const daysLeft = Math.ceil((new Date(o.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `أوردر "${o.description}" لـ ${o.client.name}: ${produced}/${o.totalQuantity} قطعة (تسليم ${delivered})، باقي ${daysLeft} يوم، حالة: ${o.status}`;
  }).join("\n");

  return `
=== بيانات المصنع الحالية ===
التاريخ: ${today}
الشهر: ${month}

--- الموظفين ---
إجمالي الموظفين النشطين: ${employeeCount}
حاضر اليوم: ${presentToday} | غائب: ${absentToday} | متأخر: ${lateToday}

--- إنتاج الشهر ---
${productionSummary || "لا توجد بيانات إنتاج هذا الشهر"}

--- الأوردرات النشطة ---
${ordersSummary || "لا توجد أوردرات نشطة"}

--- المرتبات ---
${recentPayroll.length > 0 
  ? recentPayroll.map(p => `${p.employee.name}: أساسي ${p.baseSalary} + بونص انتظام ${p.attendanceBonus} + بونص انتاج ${p.productionBonus} - خصومات ${p.totalDeductions} = صافي ${p.netSalary} (${p.status})`).join("\n")
  : "لم يتم حساب المرتبات لهذا الشهر بعد"}
  `.trim();
}

const SYSTEM_PROMPT = `أنت مساعد ذكي لنظام إدارة مصنع ملابس. مهمتك:
1. الإجابة على أسئلة عن الموظفين والإنتاج والأوردرات والحضور والمرتبات
2. تحليل البيانات وتقديم ملخصات
3. اقتراح تحسينات لزيادة الإنتاجية
4. التحذير من المشاكل المحتملة (أوردرات متأخرة، غياب متكرر، إلخ)
5. المساعدة في اتخاذ القرارات

تحدث بالعربية المصرية البسيطة. كن مختصراً ومفيداً. استخدم الأرقام والبيانات الفعلية في إجاباتك.`;

export async function chatWithAI(messages: Array<{ role: string; content: string }>) {
  const context = await getFactoryContext();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `البيانات الحالية:\n${context}` },
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || "عذراً، لم أستطع معالجة طلبك.";
}

export async function generateSmartReport(reportType: string) {
  const context = await getFactoryContext();

  const prompts: Record<string, string> = {
    performance: "حلل أداء الموظفين هذا الشهر. مين الأحسن ومين محتاج تحسين؟ اقترح حلول.",
    orders: "حلل حالة الأوردرات الحالية. في أوردرات ممكن تتأخر؟ إيه الخطوات المطلوبة؟",
    financial: "اعمل ملخص مالي للشهر. المرتبات والبونص والخصومات. في حاجة تقلق؟",
    general: "اعمل ملخص شامل لحالة المصنع. إيه الإيجابيات والسلبيات والتوصيات؟",
  };

  const prompt = prompts[reportType] || prompts.general;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `البيانات الحالية:\n${context}` },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 2000,
  });

  return response.choices[0].message.content || "عذراً، لم أستطع إنشاء التقرير.";
}
