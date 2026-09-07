import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { calculateEmployeeLeaveBalance } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const targetYear = yearParam && parseInt(yearParam, 10) > 2000 ? parseInt(yearParam, 10) : new Date().getFullYear();

    const emp = await prisma.user.findUnique({
      where: { id: BigInt(authUser.id) },
    });

    if (!emp) {
      return errorResponse("User not found", 404);
    }

    const res = await calculateEmployeeLeaveBalance(emp, targetYear);
    return jsonResponse(res);
  } catch (error: any) {
    console.error("GET /api/leaves/balances/my error:", error);
    return errorResponse(error.message || "Failed to fetch leave balances", 500);
  }
}
