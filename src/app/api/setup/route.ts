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
    const { secret } = await request.json();
    if (secret !== SETUP_SECRET) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 403 });
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
