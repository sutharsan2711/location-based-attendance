import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const whereClause: any = {};
    if (!isUserAdmin(authUser)) {
      whereClause.employeeId = BigInt(authUser.id);
    }

    const [totalTasks, pendingTasks, inProgressTasks, completedTasks, urgentTasks] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.count({ where: { ...whereClause, status: "PENDING" } }),
      prisma.task.count({ where: { ...whereClause, status: "IN_PROGRESS" } }),
      prisma.task.count({ where: { ...whereClause, status: "COMPLETED" } }),
      prisma.task.count({ where: { ...whereClause, priority: "URGENT" } }),
    ]);

    return jsonResponse({
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      urgentTasks,
    });
  } catch (error: any) {
    console.error("GET /api/tasks/stats error:", error);
    return errorResponse(error.message || "Failed to fetch task stats", 500);
  }
}
