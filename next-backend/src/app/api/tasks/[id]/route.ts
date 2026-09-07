import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatTask } from "@/lib/formatters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const taskId = BigInt(id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedEmployee: true,
        assignedBy: true,
      },
    });

    if (!task) {
      return errorResponse(`Task not found with id: ${id}`, 404);
    }

    if (!isUserAdmin(authUser) && task.employeeId !== BigInt(authUser.id)) {
      return errorResponse("Forbidden: You do not have permission to view this task", 403);
    }

    return jsonResponse(formatTask(task));
  } catch (error: any) {
    console.error("GET /api/tasks/[id] error:", error);
    return errorResponse(error.message || "Failed to fetch task", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const taskId = BigInt(id);
    const body = await req.json();

    const existing = await prisma.task.findUnique({ where: { id: taskId } });
    if (!existing) {
      return errorResponse(`Task not found with id: ${id}`, 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.assignedEmployeeId !== undefined || body.employeeId !== undefined) {
      const empId = Number(body.assignedEmployeeId || body.employeeId);
      if (empId) updateData.employeeId = BigInt(empId);
    }
    if (body.assignedByName !== undefined || body.whoAssigned !== undefined) {
      updateData.assignedByName = (body.assignedByName || body.whoAssigned).trim();
    }
    if (body.department !== undefined) updateData.department = body.department?.trim() || null;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.startDate !== undefined) updateData.startDate = body.startDate ? new Date(body.startDate) : null;
    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    if (body.completionNotes !== undefined) updateData.completionNotes = body.completionNotes || null;
    if (body.checklistJson !== undefined) updateData.checklistJson = body.checklistJson || null;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        assignedEmployee: true,
        assignedBy: true,
      },
    });

    return jsonResponse(formatTask(updated));
  } catch (error: any) {
    console.error("PUT /api/tasks/[id] error:", error);
    return errorResponse(error.message || "Failed to update task", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const taskId = BigInt(id);

    await prisma.task.delete({
      where: { id: taskId },
    });

    return jsonResponse({ success: true, message: `Task ${id} deleted successfully` });
  } catch (error: any) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return errorResponse(error.message || "Failed to delete task", 500);
  }
}
