import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAssetRequest } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (category && category !== "ALL") where.category = category;
    if (priority && priority !== "ALL") where.priority = priority;

    const requests = await prisma.assetRequest.findMany({
      where,
      include: {
        employee: true,
        asset: {
          include: { assignedEmployee: true },
        },
      },
      orderBy: [{ status: "asc" }, { id: "desc" }],
    });

    return jsonResponse(requests.map(formatAssetRequest));
  } catch (error: any) {
    console.error("GET /api/assets/requests error:", error);
    return errorResponse(error.message || "Failed to fetch asset requests", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const { title, description, category, requestType, priority, assetId } = body;

    if (!title || !description || !category) {
      return errorResponse("Title, description, and category are required", 400);
    }

    const created = await prisma.assetRequest.create({
      data: {
        employeeId: BigInt(authUser.id),
        assetId: assetId ? BigInt(assetId) : null,
        requestType: requestType || "NEW_ASSET",
        category,
        title: title.trim(),
        description: description.trim(),
        priority: priority || "MEDIUM",
        status: "PENDING",
      },
      include: {
        employee: true,
        asset: {
          include: { assignedEmployee: true },
        },
      },
    });

    return jsonResponse(formatAssetRequest(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/assets/requests error:", error);
    return errorResponse(error.message || "Failed to submit asset request", 500);
  }
}
