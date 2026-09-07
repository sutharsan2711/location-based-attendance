import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatPermission } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};
    if (employeeId) whereClause.employeeId = BigInt(employeeId);
    if (status) whereClause.status = status;
    if (startDate && endDate) {
      whereClause.permissionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const list = await prisma.permissionRequest.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    });

    return jsonResponse(list.map(formatPermission));
  } catch (error: any) {
    console.error("GET /api/admin/permissions error:", error);
    return errorResponse(error.message || "Failed to fetch permissions", 500);
  }
}
