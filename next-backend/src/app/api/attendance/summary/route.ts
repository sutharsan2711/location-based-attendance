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

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") ? BigInt(searchParams.get("employeeId")!) : BigInt(authUser.id);
    const month = parseInt(searchParams.get("month") || `${new Date().getMonth() + 1}`, 10);
    const year = parseInt(searchParams.get("year") || `${new Date().getFullYear()}`, 10);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        attendanceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalDays = records.length;
    const presentDays = records.filter((r: any) => r.status === "LOGGED_IN" || r.status === "COMPLETED").length;
    const onTimeDays = records.filter((r: any) => r.timingStatus === "PRESENT").length;
    const lateDays = records.filter((r: any) => r.timingStatus === "LATE").length;
    const permissionDays = records.filter((r: any) => r.timingStatus === "PERMISSION").length;

    return jsonResponse({
      month,
      year,
      totalDays,
      presentDays,
      onTimeDays,
      lateDays,
      permissionDays,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/summary error:", error);
    return errorResponse(error.message || "Failed to fetch attendance summary", 500);
  }
}
