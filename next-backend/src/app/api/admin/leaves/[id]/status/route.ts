import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLeave } from "@/lib/formatters";

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
    const body = await req.json();
    const status = body.status;
    const adminRemarks = body.adminRemarks || body.remarks || null;

    if (!status || !["APPROVED", "REJECTED", "PENDING", "CANCELLED"].includes(status.toUpperCase())) {
      return errorResponse("Invalid leave status", 400);
    }

    const existing = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!existing) {
      return errorResponse(`Leave request not found with ID: ${id}`, 404);
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: status.toUpperCase(),
        adminRemarks,
      },
      include: { employee: true },
    });

    return jsonResponse(formatLeave(updated));
  } catch (error: any) {
    console.error("PATCH /api/admin/leaves/[id]/status error:", error);
    return errorResponse(error.message || "Failed to update leave status", 500);
  }
}
