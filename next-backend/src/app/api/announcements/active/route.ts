import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAnnouncement } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const currentEmp = await prisma.user.findUnique({
      where: { id: BigInt(authUser.id) },
    });

    const department = currentEmp?.department || null;
    const role = currentEmp?.role || null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeList = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: today } },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    // Filter by target department/role if applicable
    const filtered = activeList.filter((a) => {
      if (a.targetDepartment && department && a.targetDepartment.toUpperCase() !== department.toUpperCase()) {
        return false;
      }
      if (a.targetRole && role && a.targetRole.toUpperCase() !== role.toUpperCase()) {
        return false;
      }
      return true;
    });

    return jsonResponse(filtered.map(formatAnnouncement));
  } catch (error: any) {
    console.error("GET /api/announcements/active error:", error);
    return errorResponse(error.message || "Failed to fetch active announcements", 500);
  }
}
