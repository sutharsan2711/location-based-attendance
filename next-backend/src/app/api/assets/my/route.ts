import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAsset } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const assets = await prisma.asset.findMany({
      where: {
        assignedToEmployeeId: BigInt(authUser.id),
      },
      include: {
        assignedEmployee: true,
      },
      orderBy: { id: "desc" },
    });

    return jsonResponse(assets.map(formatAsset));
  } catch (error: any) {
    console.error("GET /api/assets/my error:", error);
    return errorResponse(error.message || "Failed to fetch my assets", 500);
  }
}
