import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAsset } from "@/lib/formatters";

export const dynamic = "force-dynamic";

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
    const assetId = BigInt(id);

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      include: {
        assignedEmployee: true,
        assetRequests: {
          include: { employee: true },
          orderBy: { id: "desc" },
        },
      },
    });

    if (!asset) {
      return errorResponse("Asset not found", 404);
    }

    return jsonResponse(formatAsset(asset));
  } catch (error: any) {
    console.error("GET /api/assets/[id] error:", error);
    return errorResponse(error.message || "Failed to fetch asset", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const assetId = BigInt(id);
    const body = await req.json();

    const existing = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!existing) {
      return errorResponse("Asset not found", 404);
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.category) updateData.category = body.category;
    if (body.model !== undefined) updateData.model = body.model?.trim() || null;
    if (body.serialNumber !== undefined) updateData.serialNumber = body.serialNumber?.trim() || null;
    if (body.status) updateData.status = body.status;
    if (body.condition) updateData.condition = body.condition;
    if (body.purchaseDate !== undefined) updateData.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null;
    if (body.purchaseCost !== undefined) updateData.purchaseCost = body.purchaseCost !== null ? Number(body.purchaseCost) : null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;

    const updated = await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
      include: { assignedEmployee: true },
    });

    return jsonResponse(formatAsset(updated));
  } catch (error: any) {
    console.error("PUT /api/assets/[id] error:", error);
    return errorResponse(error.message || "Failed to update asset", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const assetId = BigInt(id);

    const existing = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!existing) {
      return errorResponse("Asset not found", 404);
    }

    await prisma.asset.delete({ where: { id: assetId } });

    return jsonResponse({ success: true, message: "Asset deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/assets/[id] error:", error);
    return errorResponse(error.message || "Failed to delete asset", 500);
  }
}
