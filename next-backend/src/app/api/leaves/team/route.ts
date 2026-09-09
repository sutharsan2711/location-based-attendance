import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLeave } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const currentEmp = await prisma.user.findUnique({
      where: { id: BigInt(authUser.id) },
    });

    if (!currentEmp) {
      return errorResponse("Employee not found", 404);
    }

    const department = currentEmp.department;

    // Fetch team members in the same department (or all active if department not set)
    const teamEmployees = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { not: "ADMIN" },
        ...(department ? { department } : {}),
      },
      select: { id: true, name: true, employeeCode: true, department: true, role: true },
    });

    const teamEmpIds = teamEmployees.map((e) => e.id);

    // Fetch approved leaves and pending leaves for these team members
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const ninetyDaysAhead = new Date();
    ninetyDaysAhead.setDate(now.getDate() + 90);

    const teamLeaves = await prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: teamEmpIds },
        status: { in: ["APPROVED", "PENDING"] },
        toDate: { gte: thirtyDaysAgo },
        fromDate: { lte: ninetyDaysAhead },
      },
      orderBy: { fromDate: "asc" },
      include: { employee: true, handoverEmployee: true },
    });

    // Also fetch any leaves where current employee is designated as the handover person
    const handoverToMe = await prisma.leaveRequest.findMany({
      where: {
        handoverEmployeeId: BigInt(authUser.id),
        status: "APPROVED",
        toDate: { gte: thirtyDaysAgo },
      },
      orderBy: { fromDate: "asc" },
      include: { employee: true, handoverEmployee: true },
    });

    return jsonResponse({
      department: department || "All Company",
      teamMembers: teamEmployees.map((e) => ({
        id: Number(e.id),
        name: e.name,
        employeeCode: e.employeeCode,
        department: e.department,
        role: e.role,
      })),
      teamLeaves: teamLeaves.map(formatLeave),
      delegatedToMe: handoverToMe.map(formatLeave),
    });
  } catch (error: any) {
    console.error("GET /api/leaves/team error:", error);
    return errorResponse(error.message || "Failed to fetch team leaves", 500);
  }
}
