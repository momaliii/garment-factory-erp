import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const prisma = new PrismaClient({ adapter });

const SYSTEM_ROLES = [
  {
    name: "owner",
    label: "أونر",
    permissions: {
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
    },
  },
  {
    name: "developer",
    label: "مطور",
    permissions: {
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
    },
  },
  {
    name: "production_manager",
    label: "مدير انتاج",
    permissions: {
      dashboard: true,
      production: "full",
      orders: "full",
      machines: "full",
      reports: true,
    },
  },
  {
    name: "hr",
    label: "اتش ار",
    permissions: {
      dashboard: true,
      employees: "full",
      attendance: "full",
      payroll: "full",
      reports: true,
      finance: "read",
    },
  },
  {
    name: "quality_manager",
    label: "مدير جودة",
    permissions: {
      dashboard: true,
      production: "read",
      orders: "read",
      reports: true,
    },
  },
  {
    name: "worker",
    label: "عامل",
    permissions: {
      dashboard: "read",
      production: "read",
      payroll: "read",
    },
  },
];

async function main() {
  console.log("بدء إضافة البيانات التجريبية...");

  // System Roles
  const createdRoles: Record<string, string> = {};
  for (const role of SYSTEM_ROLES) {
    const created = await prisma.role.upsert({
      where: { name: role.name },
      update: {
        label: role.label,
        permissions: JSON.stringify(role.permissions),
      },
      create: {
        name: role.name,
        label: role.label,
        permissions: JSON.stringify(role.permissions),
        isSystem: true,
      },
    });
    createdRoles[role.name] = created.id;
  }
  console.log(`- ${SYSTEM_ROLES.length} دور (أدوار النظام)`);

  // Owner user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "admin" },
    update: { roleId: createdRoles.owner },
    create: {
      username: "admin",
      password: hashedPassword,
      name: "مدير النظام",
      roleId: createdRoles.owner,
    },
  });

  // Machines
  const machines = [
    { name: "أوفرلوك 1", type: "overlock" },
    { name: "أوفرلوك 2", type: "overlock" },
    { name: "أوفرلوك 3", type: "overlock" },
    { name: "أوفرلوك 4", type: "overlock" },
    { name: "أوفرلوك 5", type: "overlock" },
    { name: "أورليه 1", type: "surger" },
    { name: "أورليه 2", type: "surger" },
    { name: "أورليه 3", type: "surger" },
    { name: "سنجل 1", type: "single" },
    { name: "استك لطش 1", type: "elastic" },
    { name: "مكبس 1", type: "press" },
    { name: "مكبس 2", type: "press" },
    { name: "مكواة 1", type: "iron" },
    { name: "مكواة 2", type: "iron" },
    { name: "طربيزة قص", type: "cutting" },
    { name: "تعبئة 1", type: "packing" },
    { name: "تعبئة 2", type: "packing" },
    { name: "تعبئة 3", type: "packing" },
  ];

  const createdMachines = [];
  for (const m of machines) {
    const machine = await prisma.machine.create({ data: m });
    createdMachines.push(machine);
  }

  // Employees
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
    const emp = await prisma.employee.create({
      data: { ...employees[i], machineId },
    });
    createdEmployees.push(emp);
  }

  // Clients
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

  // Orders
  const today = new Date();
  const orders = [
    {
      clientId: createdClients[0].id,
      type: "cmt",
      description: "تي شيرت قطن رجالي",
      totalQuantity: 5000,
      unitPrice: 15,
      deadline: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "in_progress",
    },
    {
      clientId: createdClients[1].id,
      type: "full",
      description: "بنطلون جينز حريمي",
      totalQuantity: 2000,
      unitPrice: 120,
      deadline: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "new",
    },
    {
      clientId: createdClients[2].id,
      type: "cmt",
      description: "بلوزة حريمي صيفي",
      totalQuantity: 3000,
      unitPrice: 10,
      deadline: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      status: "in_progress",
    },
  ];

  const createdOrders = [];
  for (const o of orders) {
    const order = await prisma.order.create({ data: o });
    createdOrders.push(order);
  }

  // Order Progress
  await prisma.orderProgress.createMany({
    data: [
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], produced: 800, delivered: 0 },
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], produced: 1200, delivered: 800 },
      { orderId: createdOrders[0].id, date: today.toISOString().split("T")[0], produced: 500, delivered: 400 },
      { orderId: createdOrders[2].id, date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], produced: 1500, delivered: 1000 },
    ],
  });

  // Fabric Receiving
  await prisma.fabricReceiving.createMany({
    data: [
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], fabricType: "قطن أبيض", quantity: 2000, unit: "meter" },
      { orderId: createdOrders[0].id, date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], fabricType: "قطن أبيض", quantity: 3000, unit: "meter" },
      { orderId: createdOrders[2].id, date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], fabricType: "شيفون", quantity: 1500, unit: "meter" },
    ],
  });

  // Attendance for the last 7 days
  for (let d = 6; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5) continue;

    const dateStr = date.toISOString().split("T")[0];

    for (const emp of createdEmployees) {
      const rand = Math.random();
      let status: string;
      let checkIn: string;
      let checkOut: string | null;

      if (rand < 0.85) {
        status = "present";
        checkIn = "08:00";
        checkOut = "16:00";
      } else if (rand < 0.92) {
        status = "late";
        checkIn = `08:${Math.floor(Math.random() * 50 + 10)}`;
        checkOut = "16:00";
      } else {
        status = "absent";
        checkIn = "";
        checkOut = null;
      }

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: dateStr,
          checkIn: status !== "absent" ? checkIn : null,
          checkOut,
          status,
        },
      });
    }
  }

  // Daily Production for the last 7 days
  for (let d = 6; d >= 0; d--) {
    const date = new Date(today.getTime() - d * 24 * 60 * 60 * 1000);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 5) continue;

    const dateStr = date.toISOString().split("T")[0];
    const productionEmployees = createdEmployees.slice(0, 8);

    for (const emp of productionEmployees) {
      const quantity = Math.floor(Math.random() * 80 + 60);
      const orderId = createdOrders[Math.floor(Math.random() * createdOrders.length)].id;

      await prisma.dailyProduction.create({
        data: {
          employeeId: emp.id,
          orderId,
          date: dateStr,
          quantity,
        },
      });
    }
  }

  // Bonus Settings
  await prisma.bonusSettings.upsert({
    where: { type: "attendance" },
    update: {},
    create: {
      type: "attendance",
      rules: JSON.stringify({
        fullAttendanceBonus: 500,
        maxAbsenceDays: 0,
        lateDeductionPerDay: 50,
      }),
    },
  });

  await prisma.bonusSettings.upsert({
    where: { type: "production" },
    update: {},
    create: {
      type: "production",
      rules: JSON.stringify({
        targetPerDay: 80,
        bonusPerPiece: 2,
        minimumDays: 20,
      }),
    },
  });

  console.log("تم إضافة البيانات التجريبية بنجاح!");
  console.log(`- ${SYSTEM_ROLES.length} دور`);
  console.log(`- ${createdMachines.length} معدة`);
  console.log(`- ${createdEmployees.length} موظف`);
  console.log(`- ${createdClients.length} عميل`);
  console.log(`- ${createdOrders.length} أوردر`);
  console.log("- مستخدم أونر (admin/admin123)");
  console.log("- بيانات حضور وانتاج لآخر 7 أيام");
  console.log("- إعدادات البونص");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
