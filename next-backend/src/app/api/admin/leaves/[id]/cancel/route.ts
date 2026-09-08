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
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const leaveId = BigInt(id);
    const body = await req.json().catch(() => ({}));
    const adminRemarks = body.withdrawalReason || body.adminRemarks || body.remarks || "Cancelled by Admin";

    const existing = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!existing) {
      return errorResponse(`Leave request not found with ID: ${id}`, 404);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: "CANCELLED",
        adminRemarks,
      },
      include: { employee: true },
    });

    return jsonResponse(formatLeave(updated));
  } catch (error: any) {
    console.error("PATCH /api/admin/leaves/[id]/cancel error:", error);
    return errorResponse(error.message || "Failed to cancel leave", 500);
  }
}
