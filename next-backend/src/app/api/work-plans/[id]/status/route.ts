import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan } from "@/lib/formatters";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const planId = BigInt(id);

    const existing = await prisma.dailyWorkPlan.findUnique({
      where: { id: planId },
    });

    if (!existing) {
      return errorResponse("Work plan item not found", 404);
    }

    if (existing.employeeId !== BigInt(authUser.id) && authUser.role !== "ADMIN") {
      return errorResponse("Forbidden: You cannot modify this work plan", 403);
    }

    const body = await req.json();
    const updated = await prisma.dailyWorkPlan.update({
      where: { id: planId },
      data: {
        status: body.status !== undefined ? body.status : existing.status,
        reasonRemarks:
          body.reasonRemarks !== undefined ? body.reasonRemarks.trim() : existing.reasonRemarks,
        timeSpent: body.timeSpent !== undefined ? body.timeSpent.trim() : existing.timeSpent,
      },
    });

    return jsonResponse(formatWorkPlan(updated));
  } catch (error: any) {
    console.error("PATCH /api/work-plans/[id]/status error:", error);
    return errorResponse(error.message || "Failed to update work plan status", 500);
  }
}
