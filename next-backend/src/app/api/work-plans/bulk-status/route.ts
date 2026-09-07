import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan } from "@/lib/formatters";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const updates: Array<{
      id: number;
      status: string;
      reasonRemarks?: string;
      timeSpent?: string;
    }> = body.updates || [];

    if (!Array.isArray(updates) || updates.length === 0) {
      return errorResponse("No updates provided", 400);
    }

    const updatedPlans = [];

    for (const item of updates) {
      const planId = BigInt(item.id);
      const plan = await prisma.dailyWorkPlan.findUnique({
        where: { id: planId },
      });

      if (plan && (plan.employeeId === BigInt(authUser.id) || authUser.role === "ADMIN")) {
        const res = await prisma.dailyWorkPlan.update({
          where: { id: planId },
          data: {
            status: item.status !== undefined ? item.status : plan.status,
            reasonRemarks:
              item.reasonRemarks !== undefined ? item.reasonRemarks.trim() : plan.reasonRemarks,
            timeSpent: item.timeSpent !== undefined ? item.timeSpent.trim() : plan.timeSpent,
          },
        });
        updatedPlans.push(formatWorkPlan(res));
      }
    }

    return jsonResponse({ success: true, plans: updatedPlans });
  } catch (error: any) {
    console.error("POST /api/work-plans/bulk-status error:", error);
    return errorResponse(error.message || "Failed to update bulk statuses", 500);
  }
}
