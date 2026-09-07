import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatPermission } from "@/lib/formatters";

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
    const permId = BigInt(id);
    const body = await req.json();
    const status = body.status;
    const adminRemarks = body.adminRemarks || body.remarks || null;

    if (!status || !["APPROVED", "REJECTED", "PENDING", "CANCELLED"].includes(status.toUpperCase())) {
      return errorResponse("Invalid permission status", 400);
    }

    const existing = await prisma.permissionRequest.findUnique({ where: { id: permId } });
    if (!existing) {
      return errorResponse(`Permission request not found with ID: ${id}`, 404);
    }

    const updated = await prisma.permissionRequest.update({
      where: { id: permId },
      data: {
        status: status.toUpperCase(),
        adminRemarks,
      },
      include: { employee: true },
    });

    return jsonResponse(formatPermission(updated));
  } catch (error: any) {
    console.error("PATCH /api/admin/permissions/[id]/status error:", error);
    return errorResponse(error.message || "Failed to update permission status", 500);
  }
}
