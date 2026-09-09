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

    const employees = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: { not: "ADMIN" },
      },
      orderBy: { name: "asc" },
    });

    const reportData = await Promise.all(
      employees.map(async (emp) => {
        const empId = emp.id;

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
        const notCompleted = plans.filter((p) => p.status === "NOT_COMPLETED" || p.status === "NOT_STARTED").length;

        let kpiScore = 0;
        let kpiLabel = "No Tasks";
        if (totalTasks > 0) {
          kpiScore = Math.round(((completed * 100 + inProgress * 50) / totalTasks));
          if (kpiScore >= 90) kpiLabel = "Excellent";
          else if (kpiScore >= 80) kpiLabel = "Very Good";
          else if (kpiScore >= 70) kpiLabel = "Good";
          else if (kpiScore >= 60) kpiLabel = "Needs Attention";
          else kpiLabel = "At Risk";
        }

        const presentDays = attendances.filter((a) => a.status === "LOGGED_IN" || a.status === "COMPLETED").length;
        const onTimeDays = attendances.filter((a) => a.timingStatus === "PRESENT").length;
        const lateDays = attendances.filter((a) => a.timingStatus === "LATE").length;

        return {
          employeeCode: emp.employeeCode,
          name: emp.name,
          email: emp.email,
          department: emp.department || "General",
          role: emp.role,
          totalTasks,
          completedTasks: completed,
          inProgressTasks: inProgress,
          notCompletedTasks: notCompleted,
          kpiScore: `${kpiScore}%`,
          kpiNumeric: kpiScore,
          performanceRating: kpiLabel,
          presentDays,
          onTimeDays,
          lateDays,
          year,
          month,
        };
      })
    );

    return jsonResponse({
      month,
      year,
      generatedAt: new Date().toISOString(),
      report: reportData,
    });
  } catch (error: any) {
    console.error("GET /api/admin/kpi/export error:", error);
    return errorResponse(error.message || "Failed to export KPI report", 500);
  }
}
