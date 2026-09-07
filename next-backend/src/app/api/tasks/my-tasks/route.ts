import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatTask } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const tasks = await prisma.task.findMany({
      where: { employeeId: BigInt(authUser.id) },
      orderBy: { createdAt: "desc" },
      include: {
        assignedEmployee: true,
        assignedBy: true,
      },
    });

    return jsonResponse(tasks.map(formatTask));
  } catch (error: any) {
    console.error("GET /api/tasks/my-tasks error:", error);
    return errorResponse(error.message || "Failed to fetch my tasks", 500);
  }
}
