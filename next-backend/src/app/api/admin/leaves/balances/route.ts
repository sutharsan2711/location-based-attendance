import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { calculateEmployeeLeaveBalance } from "@/lib/formatters";

const DUMMY_EMP_CODES = new Set(["EMP001", "EMP002", "EMP003", "EMP004", "EMP005"]);
const DUMMY_NAMES = new Set(["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]);

function isDummyUser(u: { employeeCode?: string | null; name?: string | null }) {
  if (u.employeeCode && DUMMY_EMP_CODES.has(u.employeeCode.trim().toUpperCase())) return true;
  if (u.name && DUMMY_NAMES.has(u.name.trim())) return true;
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const targetYear = yearParam && parseInt(yearParam, 10) > 2000 ? parseInt(yearParam, 10) : new Date().getFullYear();

    const employees = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
    });

    const validEmployees = employees.filter((u: any) => !isDummyUser(u));

    const result = [];
    for (const emp of validEmployees) {
      const bal = await calculateEmployeeLeaveBalance(emp, targetYear);
      result.push(bal);
    }

    return jsonResponse(result);
  } catch (error: any) {
    console.error("GET /api/admin/leaves/balances error:", error);
    return errorResponse(error.message || "Failed to fetch all leave balances", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const employeeId = Number(body.employeeId);
    const year = parseInt(body.year || `${new Date().getFullYear()}`, 10);

    if (!employeeId || isNaN(employeeId)) {
      return errorResponse("Employee ID is required", 400);
    }

    const emp = await prisma.user.findUnique({
      where: { id: BigInt(employeeId) },
    });

    if (!emp) {
      return errorResponse(`Employee not found with ID: ${employeeId}`, 404);
    }

    const updateData: any = {};
    if (body.casualLeaveGranted !== undefined) updateData.casualLeaveGranted = Number(body.casualLeaveGranted);
    if (body.casualLeaveCarriedForward !== undefined) updateData.casualLeaveCarriedForward = Number(body.casualLeaveCarriedForward);
    if (body.sickLeaveGranted !== undefined) updateData.sickLeaveGranted = Number(body.sickLeaveGranted);
    if (body.sickLeaveCarriedForward !== undefined) updateData.sickLeaveCarriedForward = Number(body.sickLeaveCarriedForward);
    if (body.compOffGranted !== undefined) updateData.compOffGranted = Number(body.compOffGranted);
    if (body.compOffCarriedForward !== undefined) updateData.compOffCarriedForward = Number(body.compOffCarriedForward);
    if (body.lossOfPayGranted !== undefined) updateData.lossOfPayGranted = Number(body.lossOfPayGranted);
    if (body.workFromHomeGranted !== undefined) updateData.workFromHomeGranted = Number(body.workFromHomeGranted);

    await prisma.leaveBalance.upsert({
      where: {
        employeeId_year: {
          employeeId: BigInt(employeeId),
          year,
        },
      },
      create: {
        employeeId: BigInt(employeeId),
        year,
        casualLeaveGranted: updateData.casualLeaveGranted ?? 5.0,
        casualLeaveCarriedForward: updateData.casualLeaveCarriedForward ?? 0.0,
        sickLeaveGranted: updateData.sickLeaveGranted ?? 1.0,
        sickLeaveCarriedForward: updateData.sickLeaveCarriedForward ?? 0.0,
        compOffGranted: updateData.compOffGranted ?? 0.0,
        compOffCarriedForward: updateData.compOffCarriedForward ?? 0.0,
        lossOfPayGranted: updateData.lossOfPayGranted ?? 0.0,
        workFromHomeGranted: updateData.workFromHomeGranted ?? 0.0,
      },
      update: updateData,
    });

    const updatedSummary = await calculateEmployeeLeaveBalance(emp, year);
    return jsonResponse(updatedSummary);
  } catch (error: any) {
    console.error("PUT /api/admin/leaves/balances error:", error);
    return errorResponse(error.message || "Failed to update leave balances", 500);
  }
}
