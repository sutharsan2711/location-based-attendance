import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

const MONTH_NAMES = [
  "",
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const month = parseInt(searchParams.get("month") || `${now.getMonth() + 1}`, 10);
    const year = parseInt(searchParams.get("year") || `${now.getFullYear()}`, 10);

    const totalEmployees = await prisma.user.count({
      where: { role: { not: "ADMIN" }, status: "ACTIVE" },
    });

    const payrolls = await prisma.payroll.findMany({
      where: { month, year },
    });

    const generated = payrolls.length;
    const paid = payrolls.filter((p: any) => p.status === "PAID").length;
    const pending = Math.max(0, totalEmployees - generated);

    return jsonResponse({
      totalEmployees,
      generated,
      pending,
      paid,
      month,
      year,
      monthName: MONTH_NAMES[month] || "UNKNOWN",
    });
  } catch (error: any) {
    console.error("GET /api/payroll/stats error:", error);
    return errorResponse(error.message || "Failed to fetch payroll stats", 500);
  }
}
