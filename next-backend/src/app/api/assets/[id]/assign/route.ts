import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAsset } from "@/lib/formatters";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const assetId = BigInt(id);
    const body = await req.json();

    const employeeId = Number(body.employeeId);
    const assignedDateStr = body.assignedDate || new Date().toISOString().split("T")[0];
    const handoverNotes = body.handoverNotes?.trim() || null;

    if (!employeeId || isNaN(employeeId)) {
      return errorResponse("Valid employee ID is required", 400);
    }

    const [existingAsset, existingEmployee] = await Promise.all([
      prisma.asset.findUnique({ where: { id: assetId } }),
      prisma.user.findUnique({ where: { id: BigInt(employeeId) } }),
    ]);

    if (!existingAsset) {
      return errorResponse("Asset not found", 404);
    }

    if (!existingEmployee) {
      return errorResponse("Employee not found", 404);
    }

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: {
        assignedToEmployeeId: BigInt(employeeId),
        assignedDate: new Date(assignedDateStr),
        status: "ASSIGNED",
        handoverNotes,
      },
      include: {
        assignedEmployee: true,
      },
    });

    return jsonResponse({
      success: true,
      message: `Asset '${updated.name}' successfully assigned to ${existingEmployee.name}`,
      asset: formatAsset(updated),
    });
  } catch (error: any) {
    console.error("POST /api/assets/[id]/assign error:", error);
    return errorResponse(error.message || "Failed to assign asset", 500);
  }
}
