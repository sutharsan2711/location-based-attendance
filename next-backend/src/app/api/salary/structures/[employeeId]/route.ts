import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatSalaryStructure } from "@/lib/formatters";

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
      return errorResponse("Forbidden: You cannot view another employee's salary structure", 403);
    }

    const emp = await prisma.user.findUnique({
      where: { id: targetEmpId },
      include: { salaryStructure: true },
    });

    if (!emp) {
      return errorResponse(`Employee not found with ID: ${employeeId}`, 404);
    }

    return jsonResponse(formatSalaryStructure(emp, emp.salaryStructure));
  } catch (error: any) {
    console.error("GET /api/salary/structures/[employeeId] error:", error);
    return errorResponse(error.message || "Failed to fetch salary structure", 500);
  }
}
