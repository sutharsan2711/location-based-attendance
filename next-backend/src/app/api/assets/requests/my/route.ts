import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAssetRequest } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const requests = await prisma.assetRequest.findMany({
      where: {
        employeeId: BigInt(authUser.id),
      },
      include: {
        employee: true,
        asset: {
          include: { assignedEmployee: true },
        },
      },
      orderBy: { id: "desc" },
    });

    return jsonResponse(requests.map(formatAssetRequest));
  } catch (error: any) {
    console.error("GET /api/assets/requests/my error:", error);
    return errorResponse(error.message || "Failed to fetch my asset requests", 500);
  }
}
