import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAsset } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const assignedTo = searchParams.get("assignedTo");

    const where: any = {};
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (status && status !== "ALL") {
      where.status = status;
    }
    if (assignedTo) {
      where.assignedToEmployeeId = BigInt(assignedTo);
    }

    const assets = await prisma.asset.findMany({
      where,
      include: {
        assignedEmployee: true,
      },
      orderBy: { id: "desc" },
    });

    let filtered = assets;
    if (search) {
      filtered = assets.filter((a: any) => {
        return (
          a.name.toLowerCase().includes(search) ||
          a.assetCode.toLowerCase().includes(search) ||
          (a.serialNumber && a.serialNumber.toLowerCase().includes(search)) ||
          (a.model && a.model.toLowerCase().includes(search)) ||
          (a.assignedEmployee && a.assignedEmployee.name.toLowerCase().includes(search)) ||
          (a.assignedEmployee && a.assignedEmployee.employeeCode.toLowerCase().includes(search))
        );
      });
    }

    return jsonResponse(filtered.map(formatAsset));
  } catch (error: any) {
    console.error("GET /api/assets error:", error);
    return errorResponse(error.message || "Failed to fetch assets", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const { name, category, model, serialNumber, condition, purchaseDate, purchaseCost, notes } = body;

    if (!name || !category) {
      return errorResponse("Asset name and category are required", 400);
    }

    // Auto-generate assetCode if not provided
    let assetCode = body.assetCode?.trim();
    if (!assetCode) {
      const count = await prisma.asset.count();
      const prefix = category.substring(0, 3).toUpperCase();
      assetCode = `AST-${prefix}-${String(count + 1).padStart(3, "0")}`;
    }

    // Check unique assetCode
    const existingCode = await prisma.asset.findUnique({ where: { assetCode } });
    if (existingCode) {
      return errorResponse(`Asset code '${assetCode}' already exists`, 400);
    }

    if (serialNumber) {
      const existingSerial = await prisma.asset.findUnique({ where: { serialNumber } });
      if (existingSerial) {
        return errorResponse(`Serial number '${serialNumber}' already exists`, 400);
      }
    }

    const created = await prisma.asset.create({
      data: {
        assetCode,
        name: name.trim(),
        category,
        model: model?.trim() || null,
        serialNumber: serialNumber?.trim() || null,
        status: "AVAILABLE",
        condition: condition || "GOOD",
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchaseCost: purchaseCost !== undefined && purchaseCost !== null ? Number(purchaseCost) : null,
        notes: notes?.trim() || null,
      },
      include: {
        assignedEmployee: true,
      },
    });

    return jsonResponse(formatAsset(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/assets error:", error);
    return errorResponse(error.message || "Failed to create asset", 500);
  }
}
