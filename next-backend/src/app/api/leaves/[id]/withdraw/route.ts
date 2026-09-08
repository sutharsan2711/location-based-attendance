import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLeave } from "@/lib/formatters";

export const dynamic = "force-dynamic";

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
    const leaveId = BigInt(id);
    const body = await req.json().catch(() => ({}));
    const withdrawalReason = body.withdrawalReason || body.reason || body.remarks || null;

    const existing = await prisma.leaveRequest.findUnique({
      where: { id: leaveId },
      include: { employee: true },
    });

    if (!existing) {
      return errorResponse(`Leave request not found with ID: ${id}`, 404);
    }

    // Ensure only owner employee or admin can withdraw
    const isOwner = BigInt(existing.employeeId) === BigInt(authUser.id);
    if (!isOwner && !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: You can only withdraw your own leave requests", 403);
    }

    if (existing.status === "CANCELLED" || existing.status === "WITHDRAWN") {
      return errorResponse("This leave request is already withdrawn/cancelled", 400);
    }

    const note = withdrawalReason ? `Withdrawn: ${withdrawalReason}` : "Withdrawn by employee";
    const updatedRemarks = existing.remarks
      ? `${existing.remarks} | ${note}`
      : note;

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: "CANCELLED",
        remarks: updatedRemarks,
      },
      include: { employee: true },
    });

    return jsonResponse(formatLeave(updated));
  } catch (error: any) {
    console.error("PATCH /api/leaves/[id]/withdraw error:", error);
    return errorResponse(error.message || "Failed to withdraw leave request", 500);
  }
}
