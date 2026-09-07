import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatPayroll } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const monthParam = searchParams.get("month");
    const yearParam = searchParams.get("year");
    const employeeIdParam = searchParams.get("employeeId");
    const statusParam = searchParams.get("status");

    const whereClause: any = {};
    if (monthParam) whereClause.month = parseInt(monthParam, 10);
    if (yearParam) whereClause.year = parseInt(yearParam, 10);
    if (employeeIdParam) whereClause.employeeId = BigInt(employeeIdParam);
    if (statusParam) whereClause.status = statusParam;

    const list = await prisma.payroll.findMany({
      where: whereClause,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { employee: true },
    });

    return jsonResponse(list.map(formatPayroll));
  } catch (error: any) {
    console.error("GET /api/payroll error:", error);
    return errorResponse(error.message || "Failed to fetch payroll list", 500);
  }
}
