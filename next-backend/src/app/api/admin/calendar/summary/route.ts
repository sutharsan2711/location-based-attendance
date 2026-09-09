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
    const endOfMonth = new Date(year, month, 0); // last day of month

    // Fetch active employees
    const employees = await prisma.user.findMany({
      where: { status: "ACTIVE", role: { not: "ADMIN" } },
      select: { id: true, name: true, employeeCode: true, department: true },
    });
    const totalEmployeesCount = employees.length;

    // Fetch attendances for month
    const attendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true, department: true },
        },
      },
    });

    // Fetch approved leaves and WFH for month
    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        fromDate: { lte: endOfMonth },
        toDate: { gte: startOfMonth },
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true, department: true },
        },
      },
    });

    // Fetch permissions for month
    const permissions = await prisma.permissionRequest.findMany({
      where: {
        status: "APPROVED",
        permissionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        employee: {
          select: { id: true, name: true, employeeCode: true, department: true },
        },
      },
    });

    // Fetch holidays
    const holidays = await prisma.holiday.findMany({
      where: {
        holidayDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Generate day-by-day summary
    const daysInMonth = endOfMonth.getDate();
    const dailySummaries: Record<string, any> = {};

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const currentDateObj = new Date(year, month - 1, d);

      // Find attendances for this day
      const dayAttendances = attendances.filter((a) => {
        const aDate = a.attendanceDate.toISOString().split("T")[0];
        return aDate === dateStr;
      });

      const presents = dayAttendances.filter((a) => a.status === "LOGGED_IN" || a.status === "COMPLETED");
      const lates = dayAttendances.filter((a) => a.timingStatus === "LATE");

      // Find leaves covering this date
      const dayLeaves = approvedLeaves.filter((l) => {
        const fromStr = l.fromDate.toISOString().split("T")[0];
        const toStr = l.toDate.toISOString().split("T")[0];
        return dateStr >= fromStr && dateStr <= toStr && l.leaveType !== "WORK_FROM_HOME";
      });

      // Find WFH covering this date
      const dayWfh = approvedLeaves.filter((l) => {
        const fromStr = l.fromDate.toISOString().split("T")[0];
        const toStr = l.toDate.toISOString().split("T")[0];
        return dateStr >= fromStr && dateStr <= toStr && l.leaveType === "WORK_FROM_HOME";
      });

      // Find permissions on this date
      const dayPerms = permissions.filter((p) => {
        const pDate = p.permissionDate.toISOString().split("T")[0];
        return pDate === dateStr;
      });

      const holiday = holidays.find((h) => h.holidayDate.toISOString().split("T")[0] === dateStr);

      dailySummaries[dateStr] = {
        date: dateStr,
        dayOfWeek: currentDateObj.toLocaleDateString("en-US", { weekday: "short" }),
        isHoliday: !!holiday,
        holidayName: holiday ? holiday.name : null,
        totalEmployees: totalEmployeesCount,
        presentCount: presents.length,
        leaveCount: dayLeaves.length,
        wfhCount: dayWfh.length,
        lateCount: lates.length,
        permissionCount: dayPerms.length,
        presentEmployees: presents.map((a) => ({
          id: Number(a.employee.id),
          name: a.employee.name,
          employeeCode: a.employee.employeeCode,
          department: a.employee.department,
          loginTime: a.loginTime ? a.loginTime.toISOString() : null,
          logoutTime: a.logoutTime ? a.logoutTime.toISOString() : null,
          status: a.status,
          timingStatus: a.timingStatus,
        })),
        leaveEmployees: dayLeaves.map((l) => ({
          id: Number(l.employee.id),
          name: l.employee.name,
          employeeCode: l.employee.employeeCode,
          department: l.employee.department,
          leaveType: l.leaveType,
          reason: l.reason,
          isHalfDay: l.isHalfDay,
        })),
        wfhEmployees: dayWfh.map((l) => ({
          id: Number(l.employee.id),
          name: l.employee.name,
          employeeCode: l.employee.employeeCode,
          department: l.employee.department,
          reason: l.reason,
        })),
      };
    }

    return jsonResponse({
      year,
      month,
      totalEmployees: totalEmployeesCount,
      dailySummaries,
    });
  } catch (error: any) {
    console.error("GET /api/admin/calendar/summary error:", error);
    return errorResponse(error.message || "Failed to fetch calendar summary", 500);
  }
}
