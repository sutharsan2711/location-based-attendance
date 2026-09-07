import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatSalaryStructure } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const employees = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
      include: { salaryStructure: true },
    });

    const list = employees.map((emp: any) => formatSalaryStructure(emp, emp.salaryStructure));

    return jsonResponse(list);
  } catch (error: any) {
    console.error("GET /api/salary/structures error:", error);
    return errorResponse(error.message || "Failed to fetch salary structures", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const employeeId = Number(body.employeeId);

    if (!employeeId || isNaN(employeeId)) {
      return errorResponse("Employee ID is required", 400);
    }

    const emp = await prisma.user.findUnique({
      where: { id: BigInt(employeeId) },
    });

    if (!emp) {
      return errorResponse(`Employee not found with ID: ${employeeId}`, 404);
    }

    const basicSalary = Number(body.basicSalary || 0);
    const hra = Number(body.hra || 0);
    const da = Number(body.da || 0);
    const conveyanceAllowance = Number(body.conveyanceAllowance || 0);
    const medicalAllowance = Number(body.medicalAllowance || 0);
    const otherAllowance = Number(body.otherAllowance || 0);

    const pf = Number(body.pf || 0);
    const esi = Number(body.esi || 0);
    const professionalTax = Number(body.professionalTax || 0);
    const otherDeduction = Number(body.otherDeduction || 0);

    const effectiveFrom = body.effectiveFrom ? new Date(body.effectiveFrom) : new Date();

    const grossSalary = basicSalary + hra + da + conveyanceAllowance + medicalAllowance + otherAllowance;
    const totalDeduction = pf + esi + professionalTax + otherDeduction;
    const netSalary = Math.max(0, grossSalary - totalDeduction);

    const saved = await prisma.salaryStructure.upsert({
      where: { employeeId: BigInt(employeeId) },
      create: {
        employeeId: BigInt(employeeId),
        basicSalary,
        hra,
        da,
        conveyanceAllowance,
        medicalAllowance,
        otherAllowance,
        pf,
        esi,
        professionalTax,
        otherDeduction,
        effectiveFrom,
      },
      update: {
        basicSalary,
        hra,
        da,
        conveyanceAllowance,
        medicalAllowance,
        otherAllowance,
        pf,
        esi,
        professionalTax,
        otherDeduction,
        effectiveFrom,
      },
    });

    // Save revision to salary history
    await prisma.salaryHistory.create({
      data: {
        employeeId: BigInt(employeeId),
        basicSalary,
        grossSalary,
        totalDeduction,
        netSalary,
        effectiveFrom,
      },
    });

    return jsonResponse(formatSalaryStructure(emp, saved));
  } catch (error: any) {
    console.error("POST /api/salary/structures error:", error);
    return errorResponse(error.message || "Failed to save salary structure", 500);
  }
}
