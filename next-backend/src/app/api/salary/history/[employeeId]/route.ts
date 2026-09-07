import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

interface RouteParams {
  params: Promise<{ employeeId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { employeeId } = await params;
    const targetEmpId = BigInt(employeeId);

    if (!isUserAdmin(authUser) && targetEmpId !== BigInt(authUser.id)) {
      return errorResponse("Forbidden: You cannot view another employee's salary history", 403);
    }

    const emp = await prisma.user.findUnique({
      where: { id: targetEmpId },
    });

    if (!emp) {
      return errorResponse(`Employee not found with ID: ${employeeId}`, 404);
    }

    const histories = await prisma.salaryHistory.findMany({
      where: { employeeId: targetEmpId },
      orderBy: { effectiveFrom: "desc" },
    });

    const list = histories.map((h: any) => ({
      id: Number(h.id),
      employeeId: Number(h.employeeId),
      employeeName: emp.name,
      employeeCode: emp.employeeCode,
      basicSalary: Number(h.basicSalary),
      grossSalary: Number(h.grossSalary),
      totalDeduction: Number(h.totalDeduction),
      netSalary: Number(h.netSalary),
      effectiveFrom: h.effectiveFrom.toISOString().split("T")[0],
      createdAt: h.createdAt?.toISOString(),
    }));

    return jsonResponse(list);
  } catch (error: any) {
    console.error("GET /api/salary/history/[employeeId] error:", error);
    return errorResponse(error.message || "Failed to fetch salary history", 500);
  }
}
