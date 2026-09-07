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
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const employeeIdParam = searchParams.get("employeeId");

    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);
    const daysInMonth = endOfMonth.getDate();

    let employees;
    if (employeeIdParam) {
      employees = await prisma.user.findMany({
        where: { id: BigInt(employeeIdParam) },
      });
    } else {
      employees = await prisma.user.findMany({
        where: { role: { not: "ADMIN" } },
      });
    }

    const validEmployees = employees.filter((u: any) => !isDummyUser(u));

    const monthlyAttendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: { employee: true },
    });

    const approvedLeaves = await prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        fromDate: { lte: endOfMonth },
        toDate: { gte: startOfMonth },
      },
    });

    const holidays = await prisma.holiday.findMany({
      where: {
        holidayDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Compute grid data
    const gridEmployees = validEmployees.map((emp: any) => {
      const empAttendances = monthlyAttendances.filter((a: any) => a.employeeId === emp.id);
      const daysMap: Record<number, any> = {};

      let presentCount = 0;
      let lateCount = 0;
      let permissionCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        const dateStr = d.toISOString().split("T")[0];
        const isSunday = d.getDay() === 0;
        const holiday = holidays.find((h: any) => h.holidayDate.toISOString().split("T")[0] === dateStr);

        const att = empAttendances.find((a: any) => a.attendanceDate.toISOString().split("T")[0] === dateStr);
        const leave = approvedLeaves.find(
          (l: any) =>
            l.employeeId === emp.id &&
            l.fromDate.toISOString().split("T")[0] <= dateStr &&
            l.toDate.toISOString().split("T")[0] >= dateStr
        );

        if (att) {
          if (att.status === "LOGGED_IN" || att.status === "COMPLETED") {
            presentCount++;
          }
          if (att.timingStatus === "LATE") lateCount++;
          if (att.timingStatus === "PERMISSION") permissionCount++;

          daysMap[day] = {
            status: att.status,
            timingStatus: att.timingStatus,
            loginTime: att.loginTime?.toISOString(),
            logoutTime: att.logoutTime?.toISOString(),
          };
        } else if (leave) {
          daysMap[day] = {
            status: "LEAVE",
            timingStatus: "LEAVE",
            leaveType: leave.leaveType,
          };
        } else if (holiday) {
          daysMap[day] = {
            status: "HOLIDAY",
            holidayName: holiday.name,
          };
        } else if (isSunday) {
          daysMap[day] = {
            status: "WEEKEND",
          };
        } else {
          daysMap[day] = {
            status: "ABSENT",
          };
        }
      }

      return {
        id: Number(emp.id),
        name: emp.name,
        employeeCode: emp.employeeCode,
        department: emp.department,
        days: daysMap,
        presentDays: presentCount,
        lateDays: lateCount,
        permissionDays: permissionCount,
      };
    });

    return jsonResponse({
      year,
      month,
      daysInMonth,
      employees: gridEmployees,
    });
  } catch (error: any) {
    console.error("GET /api/admin/attendance-monthly error:", error);
    return errorResponse(error.message || "Failed to fetch monthly attendance grid", 500);
  }
}
