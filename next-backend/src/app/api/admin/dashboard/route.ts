import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

const DUMMY_EMP_CODES = new Set(["EMP001", "EMP002", "EMP003", "EMP004", "EMP005"]);
const DUMMY_NAMES = new Set(["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]);

function isDummyUser(u: { employeeCode?: string | null; name?: string | null }) {
  if (u.employeeCode && DUMMY_EMP_CODES.has(u.employeeCode.trim().toUpperCase())) return true;
  if (u.name && DUMMY_NAMES.has(u.name.trim())) return true;
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const selectedDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

    // Fetch all employees (excluding admin and dummy accounts)
    const allEmployees = await prisma.user.findMany({
      where: { role: { not: "ADMIN" } },
    });
    const employees = allEmployees.filter((u: any) => !isDummyUser(u));

    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((u: any) => u.status === "ACTIVE").length;

    // Attendance stats for selected date
    const dateAttendances = await prisma.attendance.findMany({
      where: { attendanceDate: selectedDate },
      include: { employee: true },
    });

    const validAttendances = dateAttendances.filter((a: any) => !isDummyUser(a.employee));

    const loginCount = validAttendances.filter(
      (a: any) => a.status === "LOGGED_IN" || a.status === "COMPLETED"
    ).length;

    const logoutCount = validAttendances.filter((a: any) => a.status === "COMPLETED").length;
    const currentlyWorking = validAttendances.filter((a: any) => a.status === "LOGGED_IN").length;
    const lateCount = validAttendances.filter((a: any) => a.timingStatus === "LATE").length;

    // Approved leaves for selected date
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        fromDate: { lte: selectedDate },
        toDate: { gte: selectedDate },
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

    const absent = Math.max(0, activeEmployees - loginCount - onLeaveCount);

    return jsonResponse({
      selectedDate: selectedDate.toISOString().split("T")[0],
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
      absent,
    });
  } catch (error: any) {
    console.error("GET /api/admin/dashboard error:", error);
    return errorResponse(error.message || "Failed to fetch admin dashboard stats", 500);
  }
}
