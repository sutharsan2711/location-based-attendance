import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAssetRequest } from "@/lib/formatters";

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
    const requestId = BigInt(id);
    const body = await req.json();

    const { status, adminRemarks } = body;
    if (!status) {
      return errorResponse("Status is required", 400);
    }

    const existing = await prisma.assetRequest.findUnique({ where: { id: requestId } });
    if (!existing) {
      return errorResponse("Asset request not found", 404);
    }

    const updated = await prisma.assetRequest.update({
      where: { id: requestId },
      data: {
        status: status.toUpperCase(),
        adminRemarks: adminRemarks !== undefined ? (adminRemarks?.trim() || null) : existing.adminRemarks,
      },
      include: {
        employee: true,
        asset: {
          include: { assignedEmployee: true },
        },
      },
    });

    return jsonResponse(formatAssetRequest(updated));
  } catch (error: any) {
    console.error("PATCH /api/assets/requests/[id]/status error:", error);
    return errorResponse(error.message || "Failed to update asset request status", 500);
  }
}
