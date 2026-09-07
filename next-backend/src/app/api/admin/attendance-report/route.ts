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

function formatTime(d?: Date | null): string {
  if (!d) return "--";
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${ampm}`;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");
    const statusParam = searchParams.get("status");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const whereClause: any = {};

    if (employeeIdParam) {
      whereClause.employeeId = BigInt(employeeIdParam);
    }

    if (statusParam) {
      whereClause.status = statusParam;
    }

    if (startDateParam && endDateParam) {
      whereClause.attendanceDate = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam),
      };
    } else if (startDateParam) {
      whereClause.attendanceDate = {
        gte: new Date(startDateParam),
      };
    } else if (endDateParam) {
      whereClause.attendanceDate = {
        lte: new Date(endDateParam),
      };
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { attendanceDate: "desc" },
      include: { employee: true },
    });

    const reportList = [];

    for (const a of attendances) {
      if (isDummyUser(a.employee)) continue;

      const dateObj = new Date(a.attendanceDate);
      const dateStr = `${String(dateObj.getDate()).padStart(2, "0")}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${dateObj.getFullYear()}`;

      let displayStatus = "Present";
      if (a.status === "LOGGED_IN") {
        displayStatus = "Working";
      } else if (a.timingStatus === "LATE") {
        displayStatus = "Late";
      } else if (a.timingStatus === "PERMISSION") {
        displayStatus = "Permission";
      } else if (a.timingStatus === "LEAVE") {
        displayStatus = "Leave";
      }

      let workingHours = "--";
      if (a.loginTime && a.logoutTime) {
        const diffMs = new Date(a.logoutTime).getTime() - new Date(a.loginTime).getTime();
        if (diffMs > 0) {
          const totalMinutes = Math.floor(diffMs / (1000 * 60));
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          workingHours = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        }
      }

      reportList.push({
        id: Number(a.id),
        employeeId: Number(a.employee.id),
        employeeCode: a.employee.employeeCode,
        employeeName: a.employee.name,
        date: dateStr,
        rawDate: a.attendanceDate.toISOString().split("T")[0],
        loginTime: formatTime(a.loginTime),
        loginDistance: a.loginDistance !== null ? `${a.loginDistance.toFixed(1)}m` : "--",
        loginAccuracy: a.loginAccuracy !== null ? `${a.loginAccuracy.toFixed(1)}m` : "--",
        logoutTime: formatTime(a.logoutTime),
        logoutDistance: a.logoutDistance !== null ? `${a.logoutDistance.toFixed(1)}m` : "--",
        logoutAccuracy: a.logoutAccuracy !== null ? `${a.logoutAccuracy.toFixed(1)}m` : "--",
        status: a.status,
        timingStatus: a.timingStatus || "PRESENT",
        displayStatus,
        workingHours,
      });
    }

    return jsonResponse(reportList);
  } catch (error: any) {
    console.error("GET /api/admin/attendance-report error:", error);
    return errorResponse(error.message || "Failed to fetch attendance report", 500);
  }
}
