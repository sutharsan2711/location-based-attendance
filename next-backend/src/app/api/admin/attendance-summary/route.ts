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
    const endDate = dateParam ? new Date(dateParam) : new Date();

    const allEmployees = await prisma.user.findMany({
      where: { role: { not: "ADMIN" }, status: "ACTIVE" },
    });
    const activeEmployees = allEmployees.filter((u: any) => !isDummyUser(u)).length;

    const chartData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

      const dateAttendances = await prisma.attendance.findMany({
        where: { attendanceDate: targetDate },
        include: { employee: true },
      });

      const valid = dateAttendances.filter((a: any) => !isDummyUser(a.employee));
      const loginCount = valid.filter((a: any) => a.status === "LOGGED_IN" || a.status === "COMPLETED").length;
      const logoutCount = valid.filter((a: any) => a.status === "COMPLETED").length;
      const absentCount = Math.max(0, activeEmployees - loginCount);

      const dayStr = `${String(targetDate.getDate()).padStart(2, "0")}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${targetDate.getFullYear()}`;

      chartData.push({
        date: dayStr,
        present: loginCount,
        absent: absentCount,
        login: loginCount,
        logout: logoutCount,
      });
    }

    return jsonResponse(chartData);
  } catch (error: any) {
    console.error("GET /api/admin/attendance-summary error:", error);
    return errorResponse(error.message || "Failed to fetch attendance summary charts", 500);
  }
}
