import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const SETUP_SECRET = "garment-factory-setup-2024";

const SYSTEM_ROLES = [
  {
    name: "owner",
    label: "أونر",
    permissions: {
      dashboard: true, employees: true, attendance: true, production: true,
      payroll: true, clients: true, orders: true, machines: true, reports: true,
      ai: true, settings: true, inventory: true, finance: true, admin: true, guest_links: true,
    },
  },
  {
    name: "developer",
    label: "مطور",
    permissions: {
      dashboard: true, employees: true, attendance: true, production: true,
      payroll: true, clients: true, orders: true, machines: true, reports: true,
      ai: true, settings: true, inventory: true, finance: true, admin: true, guest_links: true,
    },
  },
  {
    name: "production_manager",
    label: "مدير انتاج",
    permissions: { dashboard: true, production: "full", orders: "full", machines: "full", reports: true },
  },
  {
    name: "hr",
    label: "اتش ار",
    permissions: { dashboard: true, employees: "full", attendance: "full", payroll: "full", reports: true, finance: "read" },
  },
  {
    name: "quality_manager",
    label: "مدير جودة",
    permissions: { dashboard: true, production: "read", orders: "read", reports: true },
  },
  {
    name: "worker",
    label: "عامل",
    permissions: { dashboard: "read", production: "read", payroll: "read" },
  },
];

export async function POST(request: NextRequest) {
  try {
    const { secret, action } = await request.json();
    if (secret !== SETUP_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
    }

    if (action === "seed-demo") {
      return await seedDemoData();
    }

    if (action === "clear-demo") {
      return await clearDemoData();
    }

    const existingRoles = await prisma.role.count();
    if (existingRoles > 0) {
      return NextResponse.json({ message: "Already seeded", roles: existingRoles });
    }

    const createdRoles: Record<string, string> = {};
    for (const role of SYSTEM_ROLES) {
      const created = await prisma.role.create({
        data: {
          name: role.name,
          label: role.label,
          permissions: JSON.stringify(role.permissions),
          isSystem: true,
        },
      });
      createdRoles[role.name] = created.id;
    }

    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
        name: "مدير النظام",
        roleId: createdRoles.owner,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Database seeded successfully",
      roles: Object.keys(createdRoles).length,
      user: "admin / admin123",
    });
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed", details: String(error) },
      { status: 500 }
    );
  }
}

async function seedDemoData() {
  const machines = [
    { name: "أوفرلوك 1", type: "overlock" }, { name: "أوفرلوك 2", type: "overlock" },
    { name: "أوفرلوك 3", type: "overlock" }, { name: "أوفرلوك 4", type: "overlock" },
    { name: "أوفرلوك 5", type: "overlock" }, { name: "أورليه 1", type: "surger" },
    { name: "أورليه 2", type: "surger" }, { name: "أورليه 3", type: "surger" },
    { name: "سنجل 1", type: "single" }, { name: "استك لطش 1", type: "elastic" },
    { name: "مكبس 1", type: "press" }, { name: "مكبس 2", type: "press" },
    { name: "مكواة 1", type: "iron" }, { name: "مكواة 2", type: "iron" },
    { name: "طربيزة قص", type: "cutting" },
    { name: "تعبئة 1", type: "packing" }, { name: "تعبئة 2", type: "packing" }, { name: "تعبئة 3", type: "packing" },
  ];

  const existing = await prisma.machine.count();
  if (existing > 0) {
    return NextResponse.json({ message: "Demo data already exists" });
  }

  const createdMachines = [];
  for (const m of machines) {
    const machine = await prisma.machine.create({ data: m });
    createdMachines.push(machine);
  }

  const employees = [
    { name: "أحمد محمد", role: "خياط أوفرلوك", phone: "01012345678", baseSalary: 4500, paymentType: "monthly" },
    { name: "محمود علي", role: "خياط أوفرلوك", phone: "01098765432", baseSalary: 4200, paymentType: "monthly" },
    { name: "حسن إبراهيم", role: "خياط أورليه", phone: "01155667788", baseSalary: 4000, paymentType: "monthly" },
    { name: "عبدالله سعيد", role: "خياط سنجل", phone: "01234567890", baseSalary: 3800, paymentType: "monthly" },
    { name: "يوسف عمر", role: "قص", phone: "01567890123", baseSalary: 5000, paymentType: "monthly" },
    { name: "خالد أحمد", role: "كوي", phone: "01678901234", baseSalary: 3500, paymentType: "monthly" },
    { name: "سامي حسين", role: "تعبئة", phone: "01789012345", baseSalary: 3200, paymentType: "monthly" },
    { name: "فاطمة محمد", role: "تعبئة", phone: "01890123456", baseSalary: 3200, paymentType: "monthly" },
    { name: "مريم أحمد", role: "تعبئة", phone: "01901234567", baseSalary: 3200, paymentType: "monthly" },
    { name: "عمرو ياسر", role: "مساعد", phone: "01345678901", baseSalary: 2800, paymentType: "weekly" },
    { name: "طارق حسن", role: "مساعد", phone: "01456789012", baseSalary: 2500, paymentType: "weekly" },
    { name: "محمد كمال", role: "مكبس", phone: "01567891234", baseSalary: 3800, paymentType: "monthly" },
  ];

  const createdEmployees = [];
  for (let i = 0; i < employees.length; i++) {
    const machineId = i < createdMachines.length ? createdMachines[i].id : undefined;
    const emp = await prisma.employee.create({ data: { ...employees[i], machineId } });
    createdEmployees.push(emp);
  }

  const clients = [
    { name: "شركة النيل للملابس", phone: "0225551234", address: "المنطقة الصناعية - العبور" },
    { name: "محلات الأمير", phone: "0233334567", address: "شارع الأزهر - القاهرة" },
    { name: "مصنع الفخامة", phone: "0244445678", address: "6 أكتوبر - المنطقة الصناعية" },
  ];

  const createdClients = [];
  for (const c of clients) {
    const client = await prisma.client.create({ data: c });
    createdClients.push(client);
  }

  const today = new Date();
  const orders = [
    {
      clientId: createdClients[0].id, type: "cmt", description: "تي شيرت قطن رجالي",
      totalQuantity: 5000, unitPrice: 15,
      deadline: new Date(today.getTime() + 15 * 86400000).toISOString().split("T")[0], status: "in_progress",
    },
    {
      clientId: createdClients[1].id, type: "full", description: "بنطلون جينز حريمي",
      totalQuantity: 2000, unitPrice: 120,
      deadline: new Date(today.getTime() + 30 * 86400000).toISOString().split("T")[0], status: "new",
    },
    {
      clientId: createdClients[2].id, type: "cmt", description: "بلوزة حريمي صيفي",
      totalQuantity: 3000, unitPrice: 10,
      deadline: new Date(today.getTime() + 5 * 86400000).toISOString().split("T")[0], status: "in_progress",
    },
  ];

  const createdOrders = [];
  for (const o of orders) {
    const order = await prisma.order.create({ data: o });
    createdOrders.push(order);
  }

  await prisma.orderProgress.createMany({
    data: [
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0], produced: 800, delivered: 0 },
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 3 * 86400000).toISOString().split("T")[0], produced: 1200, delivered: 800 },
      { orderId: createdOrders[0].id, date: today.toISOString().split("T")[0], produced: 500, delivered: 400 },
      { orderId: createdOrders[2].id, date: new Date(today.getTime() - 2 * 86400000).toISOString().split("T")[0], produced: 1500, delivered: 1000 },
    ],
  });

  await prisma.fabricReceiving.createMany({
    data: [
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 10 * 86400000).toISOString().split("T")[0], fabricType: "قطن أبيض", quantity: 2000, unit: "meter" },
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 7 * 86400000).toISOString().split("T")[0], fabricType: "قطن أبيض", quantity: 3000, unit: "meter" },
      { orderId: createdOrders[2].id, date: new Date(today.getTime() - 5 * 86400000).toISOString().split("T")[0], fabricType: "شيفون", quantity: 1500, unit: "meter" },
    ],
  });

  for (let d = 6; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 86400000);
    if (date.getDay() === 5) continue;
    const dateStr = date.toISOString().split("T")[0];

    for (const emp of createdEmployees) {
      const rand = Math.random();
      let status: string, checkIn: string, checkOut: string | null;
      if (rand < 0.85) { status = "present"; checkIn = "08:00"; checkOut = "16:00"; }
      else if (rand < 0.92) { status = "late"; checkIn = `08:${Math.floor(Math.random() * 50 + 10)}`; checkOut = "16:00"; }
      else { status = "absent"; checkIn = ""; checkOut = null; }
      await prisma.attendance.create({
        data: { employeeId: emp.id, date: dateStr, checkIn: status !== "absent" ? checkIn : null, checkOut, status },
      });
    }
  }

  for (let d = 6; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 86400000);
    if (date.getDay() === 5) continue;
    const dateStr = date.toISOString().split("T")[0];
    for (const emp of createdEmployees.slice(0, 8)) {
      const quantity = Math.floor(Math.random() * 80 + 60);
      const orderId = createdOrders[Math.floor(Math.random() * createdOrders.length)].id;
      await prisma.dailyProduction.create({ data: { employeeId: emp.id, orderId, date: dateStr, quantity } });
    }
  }

  await prisma.bonusSettings.create({
    data: { type: "attendance", rules: JSON.stringify({ fullAttendanceBonus: 500, maxAbsenceDays: 0, lateDeductionPerDay: 50 }) },
  });
  await prisma.bonusSettings.create({
    data: { type: "production", rules: JSON.stringify({ targetPerDay: 80, bonusPerPiece: 2, minimumDays: 20 }) },
  });

  return NextResponse.json({
    success: true,
    message: "Demo data seeded",
    machines: createdMachines.length,
    employees: createdEmployees.length,
    clients: createdClients.length,
    orders: createdOrders.length,
  });
}

async function clearDemoData() {
  await prisma.dailyProduction.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.orderProgress.deleteMany({});
  await prisma.fabricReceiving.deleteMany({});
  await prisma.productionStage.deleteMany({});
  await prisma.deduction.deleteMany({});
  await prisma.payrollRecord.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.revenue.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.revenueCategory.deleteMany({});
  await prisma.expenseCategory.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.clientPortalToken.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.bonusSettings.deleteMany({});
  await prisma.webhookLog.deleteMany({});
  await prisma.webhookEndpoint.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.aiConversation.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});

  return NextResponse.json({ success: true, message: "All demo data cleared. Roles and users kept." });
}
