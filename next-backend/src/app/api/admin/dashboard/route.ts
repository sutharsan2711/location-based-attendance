import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export const dynamic = "force-dynamic";

const DUMMY_EMP_CODES = new Set(["EMP001", "EMP002", "EMP003", "EMP004", "EMP005"]);
const DUMMY_NAMES = new Set(["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]);

function isDummyUser(u: { employeeCode?: string | null; name?: string | null }) {
  if (u.employeeCode && DUMMY_EMP_CODES.has(u.employeeCode.trim().toUpperCase())) return true;
  if (u.name && DUMMY_NAMES.has(u.name.trim())) return true;
  return false;
}

function parseDateToLocalMidnight(dateStr: string, isEndOfDay: boolean = false): Date {
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-").map(Number);
    if (parts[0] > 1000) {
      // YYYY-MM-DD
      return isEndOfDay
        ? new Date(parts[0], parts[1] - 1, parts[2], 23, 59, 59, 999)
        : new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
    } else {
      // DD-MM-YYYY
      return isEndOfDay
        ? new Date(parts[2], parts[1] - 1, parts[0], 23, 59, 59, 999)
        : new Date(parts[2], parts[1] - 1, parts[0], 0, 0, 0, 0);
    }
  }
  const d = new Date(dateStr);
  return isEndOfDay
    ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
    : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const startDateParam = searchParams.get("startDate") || searchParams.get("from");
    const endDateParam = searchParams.get("endDate") || searchParams.get("to");

    let start: Date;
    let end: Date;

    if (startDateParam && endDateParam) {
      start = parseDateToLocalMidnight(startDateParam, false);
      end = parseDateToLocalMidnight(endDateParam, true);
    } else if (startDateParam) {
      start = parseDateToLocalMidnight(startDateParam, false);
      end = parseDateToLocalMidnight(startDateParam, true);
    } else if (dateParam) {
      start = parseDateToLocalMidnight(dateParam, false);
      end = parseDateToLocalMidnight(dateParam, true);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    if (start > end) {
      const temp = start;
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      end = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate(), 23, 59, 59, 999);
    }

    // Fetch all employees (excluding admin and dummy accounts)
    const allEmployees = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
    });
    const employees = allEmployees.filter((u: any) => !isDummyUser(u));

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((u: any) => u.status === "ACTIVE").length;

    // Attendance stats within the selected date range
    const rangeAttendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: start,
          lte: end,
        },
      },
      include: { employee: true },
    });

    const validAttendances = rangeAttendances.filter((a: any) => !isDummyUser(a.employee));

    const loginCount = validAttendances.filter(
      (a: any) => a.status === "LOGGED_IN" || a.status === "COMPLETED"
    ).length;

    const logoutCount = validAttendances.filter((a: any) => a.status === "COMPLETED").length;
    const currentlyWorking = validAttendances.filter((a: any) => a.status === "LOGGED_IN").length;
    const lateCount = validAttendances.filter((a: any) => a.timingStatus === "LATE").length;

    // Approved leaves overlapping with the selected date range
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        fromDate: { lte: end },
        toDate: { gte: start },
      },
      include: { employee: true },
    });
    const onLeaveCount = approvedLeaves.filter((l: any) => !isDummyUser(l.employee)).length;

    const pendingPermissionRequests = await prisma.permissionRequest.count({
      where: { status: "PENDING" },
    });

    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: { status: "PENDING" },
    });

    const isSingleDay = start.toDateString() === end.toDateString();

    let absentCount = 0;
    if (isSingleDay) {
      absentCount = Math.max(0, activeEmployees - loginCount - onLeaveCount);
    } else {
      const diffDays = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );
      const totalPotentialSlots = activeEmployees * diffDays;
      absentCount = Math.max(0, totalPotentialSlots - loginCount - onLeaveCount);
    }

    return jsonResponse({
      totalEmployees,
      activeEmployees,
      presentToday: loginCount,
      todayLogin: loginCount,
      todayLogout: logoutCount,
      currentlyWorking,
      lateToday: lateCount,
      onLeaveToday: onLeaveCount,
      pendingPermissionRequests,
      pendingLeaveRequests,
      absent: absentCount,
      isRange: !isSingleDay,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  } catch (error: any) {
    console.error("GET /api/admin/dashboard error:", error);
    return errorResponse(error.message || "Failed to fetch dashboard stats", 500);
  }
}
