/**
 * One-off: run the same Prisma calls as /api/dashboard to see which fails.
 * Usage: node --env-file=.env --import tsx scripts/check-dashboard-queries.ts
 */
import { prisma } from "../src/lib/prisma";
import { todayString, getCurrentMonth } from "../src/lib/utils";

async function run(name: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    console.log(`OK  ${name}`);
  } catch (e) {
    console.error(`FAIL ${name}`);
    console.error(e);
  }
}

async function main() {
  const today = todayString();
  const currentMonth = getCurrentMonth();
  const last14Days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last14Days.push(d.toISOString().slice(0, 10));
  }
  const last7Days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().slice(0, 10));
  }

  await run("employee.count", () =>
    prisma.employee.count({ where: { isActive: true } })
  );
  await run("attendance.count", () =>
    prisma.attendance.count({ where: { date: today, status: "present" } })
  );
  await run("dailyProduction.aggregate", () =>
    prisma.dailyProduction.aggregate({
      _sum: { quantity: true },
      where: { date: today },
    })
  );
  await run("order counts", async () => {
    await prisma.order.count({
      where: { status: { in: ["new", "in_progress"] } },
    });
    await prisma.order.count({ where: { status: "delayed" } });
  });
  await run("order.findMany", () =>
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { name: true } },
        orderProgress: { select: { produced: true, delivered: true } },
      },
    })
  );
  await run("dailyProduction.groupBy (top producers)", () =>
    prisma.dailyProduction.groupBy({
      by: ["employeeId"],
      _sum: { quantity: true },
      where: { date: { startsWith: currentMonth } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    })
  );
  await run("employee.aggregate payroll", () =>
    prisma.employee.aggregate({
      _sum: { baseSalary: true },
      where: { isActive: true },
    })
  );
  await run("dailyProduction.groupBy (14d trend)", () =>
    prisma.dailyProduction.groupBy({
      by: ["date"],
      _sum: { quantity: true },
      where: { date: { in: last14Days } },
    })
  );
  await run("order.groupBy status _count:true", () =>
    prisma.order.groupBy({ by: ["status"], _count: true })
  );
  await run("attendance.groupBy date _count:true", () =>
    prisma.attendance.groupBy({
      by: ["date"],
      _count: true,
      where: { date: { in: last7Days }, status: "present" },
    })
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
