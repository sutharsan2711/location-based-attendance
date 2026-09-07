import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan } from "@/lib/formatters";

export async function PUT(
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
        taskName: body.taskName !== undefined ? body.taskName.trim() : existing.taskName,
        category: body.category !== undefined ? body.category : existing.category,
        priority: body.priority !== undefined ? body.priority : existing.priority,
        targetDescription:
          body.targetDescription !== undefined
            ? body.targetDescription.trim()
            : existing.targetDescription,
        remarks: body.remarks !== undefined ? body.remarks.trim() : existing.remarks,
        status: body.status !== undefined ? body.status : existing.status,
        reasonRemarks:
          body.reasonRemarks !== undefined ? body.reasonRemarks.trim() : existing.reasonRemarks,
        timeSpent: body.timeSpent !== undefined ? body.timeSpent.trim() : existing.timeSpent,
      },
    });

    return jsonResponse(formatWorkPlan(updated));
  } catch (error: any) {
    console.error("PUT /api/work-plans/[id] error:", error);
    return errorResponse(error.message || "Failed to update work plan", 500);
  }
}

export async function DELETE(
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
      return errorResponse("Forbidden: You cannot delete this work plan", 403);
    }

    await prisma.dailyWorkPlan.delete({
      where: { id: planId },
    });

    return jsonResponse({ success: true, message: "Work plan item deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/work-plans/[id] error:", error);
    return errorResponse(error.message || "Failed to delete work plan", 500);
  }
}
