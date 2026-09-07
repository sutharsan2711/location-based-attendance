import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatPayroll } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    const whereClause: any = {
      employeeId: BigInt(authUser.id),
    };

    if (yearParam) {
      whereClause.year = parseInt(yearParam, 10);
    }

    const list = await prisma.payroll.findMany({
      where: whereClause,
      orderBy: [{ year: "desc" }, { month: "desc" }],
      include: { employee: true },
    });

    return jsonResponse(list.map(formatPayroll));
  } catch (error: any) {
    console.error("GET /api/payroll/my-payroll error:", error);
    return errorResponse(error.message || "Failed to fetch my payroll", 500);
  }
}
