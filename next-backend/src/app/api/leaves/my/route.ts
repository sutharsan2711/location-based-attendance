import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLeave } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const leaves = await prisma.leaveRequest.findMany({
      where: { employeeId: BigInt(authUser.id) },
      orderBy: { createdAt: "desc" },
      include: { employee: true },
    });

    return jsonResponse(leaves.map(formatLeave));
  } catch (error: any) {
    console.error("GET /api/leaves/my error:", error);
    return errorResponse(error.message || "Failed to fetch my leaves", 500);
  }
}
