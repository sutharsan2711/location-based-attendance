import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get("year") || String(now.getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(now.getMonth() + 1), 10);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const totalCalendarDays = endOfMonth.getDate();

    const employees = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { not: "ADMIN" },
      },
      orderBy: { name: "asc" },
    });

    const report = await Promise.all(
      employees.map(async (emp) => {
        const empId = emp.id;

        const attendances = await prisma.attendance.findMany({
          where: {
            employeeId: empId,
            attendanceDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const leaves = await prisma.leaveRequest.findMany({
          where: {
            employeeId: empId,
            status: "APPROVED",
            fromDate: { lte: endOfMonth },
            toDate: { gte: startOfMonth },
          },
        });

        const permissions = await prisma.permissionRequest.findMany({
          where: {
            employeeId: empId,
            status: "APPROVED",
            permissionDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const presentLogs = attendances.filter((a) => a.status === "LOGGED_IN" || a.status === "COMPLETED");
        const onTimeCount = attendances.filter((a) => a.timingStatus === "PRESENT").length;
        const lateCount = attendances.filter((a) => a.timingStatus === "LATE").length;
        const wfhCount = leaves.filter((l) => l.leaveType === "WORK_FROM_HOME").length;
        const leaveCount = leaves.filter((l) => l.leaveType !== "WORK_FROM_HOME").length;

        // Calculate total hours worked
        let totalWorkedSeconds = 0;
        presentLogs.forEach((a) => {
          if (a.loginTime && a.logoutTime) {
            const diffMs = new Date(a.logoutTime).getTime() - new Date(a.loginTime).getTime();
            if (diffMs > 0) totalWorkedSeconds += Math.floor(diffMs / 1000);
          }
        });

        const totalHours = Math.floor(totalWorkedSeconds / 3600);
        const totalMinutes = Math.floor((totalWorkedSeconds % 3600) / 60);

        return {
          employeeCode: emp.employeeCode,
          name: emp.name,
          email: emp.email,
          department: emp.department || "General",
          role: emp.role,
          month,
          year,
          calendarDays: totalCalendarDays,
          presentDays: presentLogs.length,
          onTimeDays: onTimeCount,
          lateDays: lateCount,
          leaveDays: leaveCount,
          wfhDays: wfhCount,
          permissionCount: permissions.length,
          totalWorkHours: `${totalHours}h ${totalMinutes}m`,
          avgDailyHours: presentLogs.length > 0 ? (totalHours / presentLogs.length).toFixed(1) + "h" : "0h",
        };
      })
    );

    return jsonResponse({
      month,
      year,
      generatedAt: new Date().toISOString(),
      report,
    });
  } catch (error: any) {
    console.error("GET /api/admin/attendance/monthly-report error:", error);
    return errorResponse(error.message || "Failed to generate monthly attendance report", 500);
  }
}
