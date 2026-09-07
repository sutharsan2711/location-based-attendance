import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Get all active employees
    const employees = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeCode: true,
        department: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    const results = await Promise.all(
      employees.map(async (emp) => {
        const empId = BigInt(emp.id);

        const plans = await prisma.dailyWorkPlan.findMany({
          where: {
            employeeId: empId,
            planDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const attendances = await prisma.attendance.findMany({
          where: {
            employeeId: empId,
            attendanceDate: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });

        const totalTasks = plans.length;
        const completed = plans.filter((p) => p.status === "COMPLETED").length;
        const inProgress = plans.filter((p) => p.status === "IN_PROGRESS").length;
        const notCompleted = plans.filter((p) => p.status === "NOT_COMPLETED").length;

        let kpiScore = 80;
        if (totalTasks > 0) {
          kpiScore = Math.round(((completed * 100 + inProgress * 50) / totalTasks));
        }

        let kpiLabel = "Good";
        if (kpiScore >= 90) kpiLabel = "Excellent";
        else if (kpiScore >= 80) kpiLabel = "Very Good";
        else if (kpiScore >= 70) kpiLabel = "Good";
        else if (kpiScore >= 60) kpiLabel = "Needs Attention";
        else kpiLabel = "At Risk";

        return {
          id: Number(emp.id),
          name: emp.name,
          email: emp.email,
          employeeCode: emp.employeeCode,
          department: emp.department || "General",
          role: emp.role,
          totalTasks,
          completedCount: completed,
          inProgressCount: inProgress,
          notCompletedCount: notCompleted,
          kpiScore,
          kpiLabel,
          presentDays: attendances.filter((a) => a.status === "LOGGED_IN" || a.status === "COMPLETED").length,
          onTimeDays: attendances.filter((a) => a.timingStatus === "PRESENT").length,
        };
      })
    );

    return jsonResponse({
      year,
      month,
      employees: results,
    });
  } catch (error: any) {
    console.error("GET /api/admin/kpi/employees error:", error);
    return errorResponse(error.message || "Failed to load employee KPI reports", 500);
  }
}
