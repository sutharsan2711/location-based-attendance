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

    const empId = BigInt(authUser.id);

    // Fetch the most recent attendance record for this employee
    const latestAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: empId,
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
      orderBy: [{ attendanceDate: "desc" }, { id: "desc" }],
    });

    // Check if the latest attendance belongs to today (or within the current 20h window)
    const nowIso = new Date().toISOString().slice(0, 10);
    const nowLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let isToday = false;
    if (latestAttendance) {
      const attDateStr = latestAttendance.attendanceDate
        ? new Date(latestAttendance.attendanceDate).toISOString().slice(0, 10)
        : "";
      const loginDateStr = latestAttendance.loginTime
        ? new Date(latestAttendance.loginTime).toISOString().slice(0, 10)
        : "";

      if (attDateStr === nowIso || attDateStr === nowLocal || loginDateStr === nowIso || loginDateStr === nowLocal) {
        isToday = true;
      } else if (latestAttendance.loginTime) {
        const diffHours = (Date.now() - new Date(latestAttendance.loginTime).getTime()) / (1000 * 3600);
        if (diffHours < 20) {
          isToday = true;
        }
      }
    }

    const attendance = isToday ? latestAttendance : null;

    // Check if approved Work From Home (WFH) is active for today
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const bufferStart = new Date(startOfDay.getTime() - 14 * 3600 * 1000);
    const bufferEnd = new Date(endOfDay.getTime() + 14 * 3600 * 1000);

    const approvedWfh = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: empId,
        leaveType: "WORK_FROM_HOME",
        status: "APPROVED",
        fromDate: { lte: bufferEnd },
        toDate: { gte: bufferStart },
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
