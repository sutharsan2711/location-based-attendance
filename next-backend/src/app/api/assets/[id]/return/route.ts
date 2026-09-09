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
    const body = await req.json().catch(() => ({}));

    const condition = body.condition || "GOOD";
    const returnNotes = body.notes?.trim() || null;

    const existingAsset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: { assignedEmployee: true },
    });

    if (!existingAsset) {
      return errorResponse("Asset not found", 404);
    }

    const prevEmployeeName = existingAsset.assignedEmployee?.name || "Employee";

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: {
        assignedToEmployeeId: null,
        assignedDate: null,
        status: condition === "DAMAGED" ? "UNDER_MAINTENANCE" : "AVAILABLE",
        condition,
        notes: returnNotes ? `[Return Note]: ${returnNotes}${existingAsset.notes ? `\n${existingAsset.notes}` : ""}` : existingAsset.notes,
      },
      include: {
        assignedEmployee: true,
      },
    });

    return jsonResponse({
      success: true,
      message: `Asset '${updated.name}' successfully returned from ${prevEmployeeName} and marked as ${updated.status}`,
      asset: formatAsset(updated),
    });
  } catch (error: any) {
    console.error("POST /api/assets/[id]/return error:", error);
    return errorResponse(error.message || "Failed to return asset", 500);
  }
}
