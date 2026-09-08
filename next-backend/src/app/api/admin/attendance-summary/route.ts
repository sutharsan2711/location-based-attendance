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
      const d = parseDateToLocalMidnight(dateParam, true);
      end = d;
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 6, 0, 0, 0, 0);
    } else {
      const now = new Date();
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
    }

    if (start > end) {
      const temp = start;
      start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
      end = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate(), 23, 59, 59, 999);
    }

    const allEmployees = await prisma.user.findMany({
      where: { role: { not: "ADMIN" }, status: "ACTIVE" },
    });
    const activeEmployees = allEmployees.filter((u: any) => !isDummyUser(u)).length;

    // Fetch all attendances in the date range in ONE database query
    const allAttendances = await prisma.attendance.findMany({
      where: {
        attendanceDate: {
          gte: start,
          lte: end,
        },
      },
      include: { employee: true },
    });

    // Group attendances by YYYY-MM-DD
    const attendancesByDate = new Map<string, any[]>();
    for (const a of allAttendances) {
      if (isDummyUser(a.employee)) continue;
      const key = a.attendanceDate.toISOString().split("T")[0];
      if (!attendancesByDate.has(key)) {
        attendancesByDate.set(key, []);
      }
      attendancesByDate.get(key)!.push(a);
    }

    const chartData: any[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endLimit = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    // Generate daily points for every single day in the selected date range
    let daysCount = 0;
    while (cur <= endLimit && daysCount < 100) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      const dateKey = `${y}-${m}-${d}`;
      const dayStr = `${d}-${m}-${y}`;

      const valid = attendancesByDate.get(dateKey) || [];
      const loginCount = valid.filter((a: any) => a.status === "LOGGED_IN" || a.status === "COMPLETED").length;
      const logoutCount = valid.filter((a: any) => a.status === "COMPLETED").length;
      const absentCount = Math.max(0, activeEmployees - loginCount);

      chartData.push({
        date: dayStr,
        isoDate: dateKey,
        present: loginCount,
        absent: absentCount,
        login: loginCount,
        logout: logoutCount,
      });

      cur.setDate(cur.getDate() + 1);
      daysCount++;
    }

    return jsonResponse(chartData);
  } catch (error: any) {
    console.error("GET /api/admin/attendance-summary error:", error);
    return errorResponse(error.message || "Failed to fetch attendance summary charts", 500);
  }
}
