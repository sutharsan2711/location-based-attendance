import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    const employeeId = BigInt(authUser.id);

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const presentDays = attendances.filter((a: any) => a.status === "LOGGED_IN" || a.status === "COMPLETED").length;
    const lateDays = attendances.filter((a: any) => a.timingStatus === "LATE").length;
    const onTimeDays = attendances.filter((a: any) => a.timingStatus === "PRESENT").length;
    const permissionDays = attendances.filter((a: any) => a.timingStatus === "PERMISSION").length;

    return jsonResponse({
      presentDays,
      lateDays,
      onTimeDays,
      permissionDays,
      totalWorkingDays: 26,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/stats error:", error);
    return errorResponse(error.message || "Failed to fetch attendance stats", 500);
  }
}
