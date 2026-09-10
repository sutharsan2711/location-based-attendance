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
    const dateQuery = searchParams.get("date");
    const now = dateQuery ? new Date(dateQuery) : new Date();

    // Query whole day window + 14h buffer to handle all client/server timezone offsets (UTC vs IST +5:30)
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const bufferStart = new Date(startOfDay.getTime() - 14 * 3600 * 1000);
    const bufferEnd = new Date(endOfDay.getTime() + 14 * 3600 * 1000);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        attendanceDate: {
          gte: bufferStart,
          lte: bufferEnd,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
            department: true,
            role: true,
            status: true,
          },
        },
      },
      orderBy: { id: "desc" },
    });

    // Check if approved Work From Home (WFH) is active for today
    const approvedWfh = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        leaveType: "WORK_FROM_HOME",
        status: "APPROVED",
        fromDate: { lte: endOfDay },
        toDate: { gte: startOfDay },
      },
    });

    if (!attendance) {
      return jsonResponse({
        attendance: null,
        isWfhApproved: Boolean(approvedWfh),
        wfhRequest: approvedWfh
          ? {
              id: Number(approvedWfh.id),
              fromDate: approvedWfh.fromDate.toISOString().split("T")[0],
              toDate: approvedWfh.toDate.toISOString().split("T")[0],
              reason: approvedWfh.reason,
            }
          : null,
      });
    }

    return jsonResponse({
      ...attendance,
      isWfhApproved: Boolean(approvedWfh),
      wfhRequest: approvedWfh
        ? {
            id: Number(approvedWfh.id),
            fromDate: approvedWfh.fromDate.toISOString().split("T")[0],
            toDate: approvedWfh.toDate.toISOString().split("T")[0],
            reason: approvedWfh.reason,
          }
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/attendance/today error:", error);
    return errorResponse(error.message || "Failed to fetch today's attendance", 500);
  }
}
