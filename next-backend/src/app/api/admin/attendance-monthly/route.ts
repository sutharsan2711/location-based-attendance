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

          const inTimeFormatted = att.loginTime
            ? new Date(att.loginTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
            : "--";
          const outTimeFormatted = att.logoutTime
            ? new Date(att.logoutTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
            : "--";

          daysMap[day] = {
            status: att.status === "LOGGED_IN" ? "Present" : att.status === "COMPLETED" ? "Present" : att.status,
            timingStatus: att.timingStatus,
            loginTime: inTimeFormatted,
            logoutTime: outTimeFormatted,
            code:
              att.timingStatus === "PERMISSION"
                ? "Perm"
                : att.timingStatus === "LATE"
                ? "Late"
                : "P",
          };
        } else if (leave) {
          daysMap[day] = {
            status: "Leave",
            timingStatus: "LEAVE",
            leaveType: leave.leaveType,
            code:
              leave.leaveType === "CASUAL_LEAVE"
                ? "CL"
                : leave.leaveType === "SICK_LEAVE"
                ? "SL"
                : leave.leaveType === "WORK_FROM_HOME"
                ? "WFH"
                : "Leave",
          };
        } else if (holiday) {
          daysMap[day] = {
            status: "Holiday",
            holidayName: holiday.name,
            code: "HD",
          };
        } else if (isSunday) {
          daysMap[day] = {
            status: "Week Off",
            code: "WO",
            isSunday: true,
          };
        } else {
          daysMap[day] = {
            status: "Absent",
            code: "--",
          };
        }
      }

      const totalLeaveCount = Object.values(daysMap).filter((d: any) => d.status === "Leave").length;
      const shiftLoginTime = (emp.department || "").toUpperCase().includes("IT") ? "9.00" : "8.45";

      return {
        id: Number(emp.id),
        employeeId: Number(emp.id),
        name: emp.name,
        employeeName: emp.name,
        employeeCode: emp.employeeCode,
        email: emp.email,
        phone: emp.phone,
        department: emp.department || "IT",
        status: emp.status,
        loginTime: shiftLoginTime,
        days: daysMap,
        presentDays: presentCount,
        totalPresent: presentCount,
        lateDays: lateCount,
        permissionDays: permissionCount,
        leaveDays: totalLeaveCount,
        totalLeave: totalLeaveCount,
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

// ── POST: Admin Manual Attendance Override / Sheet Update (P, AB, HD, Leave, Late, Perm, WO) ──
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const { employeeId, date, status, code, loginTime, logoutTime, year, month, days } = body;

    if (!employeeId) {
      return errorResponse("employeeId is required", 400);
    }

    const empId = BigInt(employeeId);
    const emp = await prisma.user.findUnique({ where: { id: empId } });
    if (!emp) {
      return errorResponse("Employee not found", 404);
    }

    // Helper to apply single day status
    const applyDayStatus = async (
      targetDateStr: string,
      targetCode: string,
      inTimeStr?: string,
      outTimeStr?: string
    ) => {
      const [yStr, mStr, dStr] = targetDateStr.split("-");
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10);
      const d = parseInt(dStr, 10);
      const targetDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));

      const normalizedCode = (targetCode || "").toUpperCase().trim();

      // Default timings
      const defaultLogin = new Date(Date.UTC(y, m - 1, d, 9, 0, 0));
      const defaultLogout = new Date(Date.UTC(y, m - 1, d, 18, 30, 0));

      let customLogin = defaultLogin;
      let customLogout = defaultLogout;

      if (inTimeStr && inTimeStr !== "--") {
        const [h, min] = inTimeStr.split(":").map((n) => parseInt(n, 10));
        if (!isNaN(h) && !isNaN(min)) {
          customLogin = new Date(Date.UTC(y, m - 1, d, h, min, 0));
        }
      }

      if (outTimeStr && outTimeStr !== "--") {
        const [h, min] = outTimeStr.split(":").map((n) => parseInt(n, 10));
        if (!isNaN(h) && !isNaN(min)) {
          customLogout = new Date(Date.UTC(y, m - 1, d, h, min, 0));
        }
      }

      if (normalizedCode === "P" || normalizedCode === "PRESENT") {
        // Mark Present
        await prisma.attendance.upsert({
          where: {
            employeeId_attendanceDate: {
              employeeId: empId,
              attendanceDate: targetDate,
            },
          },
          create: {
            employeeId: empId,
            attendanceDate: targetDate,
            status: "COMPLETED",
            timingStatus: "PRESENT",
            loginTime: customLogin,
            logoutTime: customLogout,
          },
          update: {
            status: "COMPLETED",
            timingStatus: "PRESENT",
            loginTime: customLogin,
            logoutTime: customLogout,
          },
        });

        // Delete any conflicting leave requests for this single day
        await prisma.leaveRequest.deleteMany({
          where: {
            employeeId: empId,
            fromDate: { lte: targetDate },
            toDate: { gte: targetDate },
          },
        });
      } else if (normalizedCode === "LATE") {
        // Mark Late
        await prisma.attendance.upsert({
          where: {
            employeeId_attendanceDate: {
              employeeId: empId,
              attendanceDate: targetDate,
            },
          },
          create: {
            employeeId: empId,
            attendanceDate: targetDate,
            status: "COMPLETED",
            timingStatus: "LATE",
            loginTime: customLogin,
            logoutTime: customLogout,
          },
          update: {
            status: "COMPLETED",
            timingStatus: "LATE",
            loginTime: customLogin,
            logoutTime: customLogout,
          },
        });
      } else if (normalizedCode === "PERM" || normalizedCode === "PERMISSION") {
        // Mark Permission
        await prisma.attendance.upsert({
          where: {
            employeeId_attendanceDate: {
              employeeId: empId,
              attendanceDate: targetDate,
            },
          },
          create: {
            employeeId: empId,
            attendanceDate: targetDate,
            status: "COMPLETED",
            timingStatus: "PERMISSION",
            loginTime: customLogin,
            logoutTime: customLogout,
          },
          update: {
            status: "COMPLETED",
            timingStatus: "PERMISSION",
            loginTime: customLogin,
            logoutTime: customLogout,
          },
        });
      } else if (normalizedCode === "AB" || normalizedCode === "ABSENT" || normalizedCode === "--") {
        // Mark Absent (Remove punch / leave)
        await prisma.attendance.deleteMany({
          where: {
            employeeId: empId,
            attendanceDate: targetDate,
          },
        });
        await prisma.leaveRequest.deleteMany({
          where: {
            employeeId: empId,
            fromDate: { lte: targetDate },
            toDate: { gte: targetDate },
          },
        });
      } else if (
        normalizedCode === "CL" ||
        normalizedCode === "SL" ||
        normalizedCode === "LEAVE" ||
        normalizedCode === "WFH"
      ) {
        // Remove attendance punch
        await prisma.attendance.deleteMany({
          where: {
            employeeId: empId,
            attendanceDate: targetDate,
          },
        });

        const leaveType =
          normalizedCode === "SL"
            ? "SICK_LEAVE"
            : normalizedCode === "WFH"
            ? "WORK_FROM_HOME"
            : "CASUAL_LEAVE";

        // Create approved leave record
        await prisma.leaveRequest.create({
          data: {
            employeeId: empId,
            leaveType: leaveType as any,
            fromDate: targetDate,
            toDate: targetDate,
            reason: "Admin manual register override",
            status: "APPROVED",
            isHalfDay: false,
          },
        });
      } else if (normalizedCode === "HD" || normalizedCode === "HOLIDAY") {
        // Special Holiday / HD
        await prisma.attendance.deleteMany({
          where: {
            employeeId: empId,
            attendanceDate: targetDate,
          },
        });
        await prisma.leaveRequest.deleteMany({
          where: {
            employeeId: empId,
            fromDate: { lte: targetDate },
            toDate: { gte: targetDate },
          },
        });
      } else if (normalizedCode === "WO" || normalizedCode === "WEEK_OFF") {
        // Week Off
        await prisma.attendance.deleteMany({
          where: {
            employeeId: empId,
            attendanceDate: targetDate,
          },
        });
      }
    };

    // Case 1: Batch days update for month
    if (days && typeof days === "object" && year && month) {
      for (const [dayKey, dayVal] of Object.entries(days)) {
        const dNum = parseInt(dayKey, 10);
        if (isNaN(dNum)) continue;
        const dStr = String(dNum).padStart(2, "0");
        const mStr = String(month).padStart(2, "0");
        const dateStr = `${year}-${mStr}-${dStr}`;

        const codeVal = typeof dayVal === "string" ? dayVal : (dayVal as any).code;
        const inTime = typeof dayVal === "object" ? (dayVal as any).loginTime : undefined;
        const outTime = typeof dayVal === "object" ? (dayVal as any).logoutTime : undefined;

        if (codeVal) {
          await applyDayStatus(dateStr, codeVal, inTime, outTime);
        }
      }

      return jsonResponse({
        success: true,
        message: `Updated attendance register for ${emp.name}`,
      });
    }

    // Case 2: Single date update
    if (date) {
      const statusCode = code || status || "P";
      await applyDayStatus(date, statusCode, loginTime, logoutTime);
      return jsonResponse({
        success: true,
        message: `Updated attendance on ${date} to ${statusCode} for ${emp.name}`,
      });
    }

    return errorResponse("Invalid request: date or days must be provided", 400);
  } catch (error: any) {
    console.error("POST /api/admin/attendance-monthly error:", error);
    return errorResponse(error.message || "Failed to update attendance register", 500);
  }
}
