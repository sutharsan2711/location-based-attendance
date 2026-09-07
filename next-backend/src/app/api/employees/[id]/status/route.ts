import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

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
    const userId = BigInt(id);
    const body = await req.json();
    const status = body.status;

    if (!status || !["ACTIVE", "INACTIVE"].includes(status.toUpperCase())) {
      return errorResponse("Invalid status value. Expected ACTIVE or INACTIVE", 400);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status: status.toUpperCase() },
    });

    return jsonResponse(updated);
  } catch (error: any) {
    console.error("PATCH /api/employees/[id]/status error:", error);
    return errorResponse(error.message || "Failed to update employee status", 500);
  }
}
