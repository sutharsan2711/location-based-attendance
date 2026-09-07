import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

function computeWorkingHours(loginTime?: Date | null, logoutTime?: Date | null): string {
  if (!loginTime || !logoutTime) return "--";
  const diffMs = new Date(logoutTime).getTime() - new Date(loginTime).getTime();
  if (diffMs <= 0) return "--";
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const employeeIdParam = searchParams.get("employeeId");
    const statusParam = searchParams.get("status");
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const searchParam = searchParams.get("search");

    const whereClause: any = {};

    if (!isUserAdmin(authUser)) {
      whereClause.employeeId = BigInt(authUser.id);
    } else if (employeeIdParam && employeeIdParam !== "ALL") {
      whereClause.employeeId = BigInt(employeeIdParam);
    }

    if (statusParam && statusParam !== "ALL") {
      whereClause.status = statusParam;
    }

    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      const end = new Date(endDateParam);
      const startUtc = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0));
      const endUtc = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999));
      whereClause.attendanceDate = {
        gte: startUtc,
        lte: endUtc,
      };
    } else if (startDateParam) {
      const start = new Date(startDateParam);
      const startUtc = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0));
      whereClause.attendanceDate = {
        gte: startUtc,
      };
    } else if (endDateParam) {
      const end = new Date(endDateParam);
      const endUtc = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999));
      whereClause.attendanceDate = {
        lte: endUtc,
      };
    }

    if (searchParam) {
      whereClause.OR = [
        { employee: { name: { contains: searchParam } } },
        { employee: { employeeCode: { contains: searchParam } } },
        { employee: { email: { contains: searchParam } } },
      ];
    }

    const attendances = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: [{ attendanceDate: "desc" }, { loginTime: "desc" }],
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
            department: true,
            role: true,
            status: true,
          },
        },
      },
    });

    const formatted = attendances.map((a) => {
      let displayStatus = "Present";
      if (a.status === "LOGGED_IN") {
        displayStatus = "Working";
      } else if (a.timingStatus === "LATE") {
        displayStatus = "Late";
      } else if (a.timingStatus === "PERMISSION") {
        displayStatus = "Permission";
      } else if (a.timingStatus === "LEAVE") {
        displayStatus = "Leave";
      } else if (a.timingStatus === "ABSENT") {
        displayStatus = "Absent";
      }

      return {
        id: Number(a.id),
        employee: {
          id: Number(a.employee.id),
          name: a.employee.name,
          employeeCode: a.employee.employeeCode,
          email: a.employee.email,
          department: a.employee.department,
          role: a.employee.role,
          status: a.employee.status,
        },
        attendanceDate: a.attendanceDate.toISOString().split("T")[0],
        loginTime: a.loginTime ? a.loginTime.toISOString() : null,
        loginLatitude: a.loginLatitude,
        loginLongitude: a.loginLongitude,
        loginAccuracy: a.loginAccuracy,
        loginDistance: a.loginDistance,
        logoutTime: a.logoutTime ? a.logoutTime.toISOString() : null,
        logoutLatitude: a.logoutLatitude,
        logoutLongitude: a.logoutLongitude,
        logoutAccuracy: a.logoutAccuracy,
        logoutDistance: a.logoutDistance,
        status: a.status,
        timingStatus: a.timingStatus,
        displayStatus,
        workingHours: computeWorkingHours(a.loginTime, a.logoutTime),
        createdAt: a.createdAt?.toISOString(),
        updatedAt: a.updatedAt?.toISOString(),
      };
    });

    return jsonResponse(formatted);
  } catch (error: any) {
    console.error("GET /api/attendance error:", error);
    return errorResponse(error.message || "Failed to fetch attendance records", 500);
  }
}
