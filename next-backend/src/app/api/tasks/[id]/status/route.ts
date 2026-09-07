import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatTask } from "@/lib/formatters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const taskId = BigInt(id);
    const body = await req.json();
    const status = body.status;

    const existing = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignedEmployee: true, assignedBy: true },
    });

    if (!existing) {
      return errorResponse(`Task not found with id: ${id}`, 404);
    }

    if (!isUserAdmin(authUser) && existing.employeeId !== BigInt(authUser.id)) {
      return errorResponse("Forbidden: You cannot change status for this task", 403);
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (body.completionNotes !== undefined) updateData.completionNotes = body.completionNotes;
    if (body.checklistJson !== undefined) updateData.checklistJson = body.checklistJson;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: { assignedEmployee: true, assignedBy: true },
    });

    return jsonResponse(formatTask(updated));
  } catch (error: any) {
    console.error("PATCH /api/tasks/[id]/status error:", error);
    return errorResponse(error.message || "Failed to update task status", 500);
  }
}
