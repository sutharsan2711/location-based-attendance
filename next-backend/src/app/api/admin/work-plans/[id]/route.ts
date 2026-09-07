import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan } from "@/lib/formatters";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.dailyWorkPlan.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return errorResponse("Work plan not found", 404);
    }

    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remarks !== undefined) updateData.remarks = body.remarks;
    if (body.reasonRemarks !== undefined) updateData.reasonRemarks = body.reasonRemarks;
    if (body.timeSpent !== undefined) updateData.timeSpent = body.timeSpent;
    if (body.taskName !== undefined) updateData.taskName = body.taskName;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.targetDescription !== undefined) updateData.targetDescription = body.targetDescription;

    const updated = await prisma.dailyWorkPlan.update({
      where: { id: BigInt(id) },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
            department: true,
            role: true,
          },
        },
      },
    });

    return jsonResponse(formatWorkPlan(updated));
  } catch (error: any) {
    console.error("PATCH /api/admin/work-plans/[id] error:", error);
    return errorResponse(error.message || "Failed to update work plan", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    await prisma.dailyWorkPlan.delete({
      where: { id: BigInt(id) },
    });

    return jsonResponse({ message: "Work plan deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/work-plans/[id] error:", error);
    return errorResponse(error.message || "Failed to delete work plan", 500);
  }
}
