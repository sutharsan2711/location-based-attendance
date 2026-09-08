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

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");

    const whereClause: any = {
      employeeId: BigInt(authUser.id),
    };

    if (statusParam && statusParam !== "ALL") {
      whereClause.status = statusParam;
    }
    if (priorityParam && priorityParam !== "ALL") {
      whereClause.priority = priorityParam;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        assignedEmployee: true,
        assignedBy: true,
      },
    });

    return jsonResponse(tasks.map(formatTask));
  } catch (error: any) {
    console.error("GET /api/tasks/my error:", error);
    return errorResponse(error.message || "Failed to fetch my tasks", 500);
  }
}
