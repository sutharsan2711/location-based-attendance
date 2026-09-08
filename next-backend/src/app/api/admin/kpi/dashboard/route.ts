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
    const departmentParam = searchParams.get("department");

    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // Get active employees
    const whereClause: any = { status: "ACTIVE" };
    if (departmentParam && departmentParam !== "ALL") {
      whereClause.department = departmentParam;
    }

    const employees = await prisma.user.findMany({
      where: whereClause,
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

    const employeeSummaries = await Promise.all(
      employees.map(async (emp) => {
        const empId = BigInt(emp.id);

        // 1. Planned Works
        const plans = await prisma.dailyWorkPlan.findMany({
          where: {
            employeeId: empId,
            planDate: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        const totalPlanned = plans.length;
        const completedPlanned = plans.filter((p) => p.status === "COMPLETED").length;
        const inProgressPlanned = plans.filter((p) => p.status === "IN_PROGRESS").length;
        const plannedScore =
          totalPlanned > 0
            ? Math.round((completedPlanned * 100 + inProgressPlanned * 50) / totalPlanned)
            : 85;

        // 2. Unplanned Works (Assigned Tasks)
        const tasks = await prisma.task.findMany({
          where: {
            employeeId: empId,
            OR: [
              { createdAt: { gte: startOfMonth, lte: endOfMonth } },
              { dueDate: { gte: startOfMonth, lte: endOfMonth } },
            ],
          },
        });
        const totalUnplanned = tasks.length;
        const completedUnplanned = tasks.filter((t) => t.status === "COMPLETED").length;
        const inProgressUnplanned = tasks.filter((t) => t.status === "IN_PROGRESS").length;
        const underReviewUnplanned = tasks.filter((t) => t.status === "UNDER_REVIEW").length;
        const unplannedScore =
          totalUnplanned > 0
            ? Math.round(
                (completedUnplanned * 100 + underReviewUnplanned * 75 + inProgressUnplanned * 50) /
                  totalUnplanned
              )
            : 90;

        // 3. Login Time & Punctuality
        const attendances = await prisma.attendance.findMany({
          where: {
            employeeId: empId,
            attendanceDate: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        const totalLoggedDays = attendances.filter(
          (a) => a.status === "LOGGED_IN" || a.status === "COMPLETED"
        ).length;
        const onTimeDays = attendances.filter((a) => a.timingStatus === "PRESENT").length;
        const lateDays = attendances.filter((a) => a.timingStatus === "LATE").length;
        const permissionDays = attendances.filter((a) => a.timingStatus === "PERMISSION").length;
        const punctualityScore =
          totalLoggedDays > 0
            ? Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    (onTimeDays * 100 + permissionDays * 80 + lateDays * 40) / totalLoggedDays
                  )
                )
              )
            : 85;

        // 4. WFH Requests
        const wfhRequests = await prisma.leaveRequest.findMany({
          where: {
            employeeId: empId,
            leaveType: "WORK_FROM_HOME",
            OR: [
              { fromDate: { gte: startOfMonth, lte: endOfMonth } },
              { toDate: { gte: startOfMonth, lte: endOfMonth } },
            ],
          },
        });
        const approvedWfhDays = wfhRequests
          .filter((r) => r.status === "APPROVED")
          .reduce((acc, r) => {
            const start = new Date(Math.max(r.fromDate.getTime(), startOfMonth.getTime()));
            const end = new Date(Math.min(r.toDate.getTime(), endOfMonth.getTime()));
            const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            return acc + days;
          }, 0);

        // 5. Work Notes & Consistency
        const notes = await prisma.dailyWorkNote.findMany({
          where: {
            employeeId: empId,
            noteDate: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        const validKpis = notes.filter((n) => n.kpiScore !== null).map((n) => n.kpiScore as number);
        const notesScore =
          validKpis.length > 0
            ? Math.round(validKpis.reduce((a, b) => a + b, 0) / validKpis.length)
            : plannedScore;

        // Composite Overall Performance Score
        const overallScore = Math.round(
          plannedScore * 0.35 +
            unplannedScore * 0.25 +
            punctualityScore * 0.2 +
            notesScore * 0.1 +
            (totalLoggedDays >= 15 ? 10 : 8)
        );

        let performanceTier = "Good";
        let tierColor = "blue";
        if (overallScore >= 90) {
          performanceTier = "Outstanding";
          tierColor = "emerald";
        } else if (overallScore >= 80) {
          performanceTier = "Excellent";
          tierColor = "cyan";
        } else if (overallScore >= 70) {
          performanceTier = "Good";
          tierColor = "indigo";
        } else if (overallScore >= 60) {
          performanceTier = "Needs Attention";
          tierColor = "amber";
        } else {
          performanceTier = "Critical";
          tierColor = "rose";
        }

        return {
          id: Number(emp.id),
          name: emp.name,
          email: emp.email,
          employeeCode: emp.employeeCode,
          department: emp.department || "General",
          role: emp.role,
          totalPlanned,
          completedPlanned,
          plannedScore,
          totalUnplanned,
          completedUnplanned,
          unplannedScore,
          totalLoggedDays,
          onTimeDays,
          lateDays,
          punctualityScore,
          approvedWfhDays,
          overallScore,
          performanceTier,
          tierColor,
        };
      })
    );

    // Sort by overall KPI score descending
    employeeSummaries.sort((a, b) => b.overallScore - a.overallScore);

    // Aggregate Dashboard Metrics
    const totalEmployees = employeeSummaries.length;
    const avgKpiScore =
      totalEmployees > 0
        ? Math.round(employeeSummaries.reduce((acc, e) => acc + e.overallScore, 0) / totalEmployees)
        : 0;

    const totalPlannedAll = employeeSummaries.reduce((acc, e) => acc + e.totalPlanned, 0);
    const completedPlannedAll = employeeSummaries.reduce((acc, e) => acc + e.completedPlanned, 0);
    const plannedCompletionRate =
      totalPlannedAll > 0 ? Math.round((completedPlannedAll / totalPlannedAll) * 100) : 0;

    const totalUnplannedAll = employeeSummaries.reduce((acc, e) => acc + e.totalUnplanned, 0);
    const completedUnplannedAll = employeeSummaries.reduce(
      (acc, e) => acc + e.completedUnplanned,
      0
    );
    const unplannedCompletionRate =
      totalUnplannedAll > 0 ? Math.round((completedUnplannedAll / totalUnplannedAll) * 100) : 0;

    const totalPresentDaysAll = employeeSummaries.reduce((acc, e) => acc + e.totalLoggedDays, 0);
    const totalOnTimeDaysAll = employeeSummaries.reduce((acc, e) => acc + e.onTimeDays, 0);
    const companyOnTimeRate =
      totalPresentDaysAll > 0
        ? Math.round((totalOnTimeDaysAll / totalPresentDaysAll) * 100)
        : 0;

    const totalWfhDaysAll = employeeSummaries.reduce((acc, e) => acc + e.approvedWfhDays, 0);

    // Department Breakdown
    const deptMap = new Map<string, { count: number; totalScore: number; planned: number; completed: number }>();
    employeeSummaries.forEach((emp) => {
      const dept = emp.department;
      if (!deptMap.has(dept)) {
        deptMap.set(dept, { count: 0, totalScore: 0, planned: 0, completed: 0 });
      }
      const item = deptMap.get(dept)!;
      item.count += 1;
      item.totalScore += emp.overallScore;
      item.planned += emp.totalPlanned;
      item.completed += emp.completedPlanned;
    });

    const departmentStats = Array.from(deptMap.entries()).map(([dept, data]) => ({
      department: dept,
      employeeCount: data.count,
      avgScore: Math.round(data.totalScore / data.count),
      plannedTasks: data.planned,
      completedTasks: data.completed,
      completionRate: data.planned > 0 ? Math.round((data.completed / data.planned) * 100) : 0,
    }));

    // Tier Counts
    const tierCounts = {
      outstanding: employeeSummaries.filter((e) => e.overallScore >= 90).length,
      excellent: employeeSummaries.filter((e) => e.overallScore >= 80 && e.overallScore < 90).length,
      good: employeeSummaries.filter((e) => e.overallScore >= 70 && e.overallScore < 80).length,
      needsAttention: employeeSummaries.filter((e) => e.overallScore >= 60 && e.overallScore < 70).length,
      critical: employeeSummaries.filter((e) => e.overallScore < 60).length,
    };

    return jsonResponse({
      year,
      month,
      metrics: {
        totalEmployees,
        avgKpiScore,
        plannedCompletionRate,
        unplannedCompletionRate,
        companyOnTimeRate,
        totalWfhDays: totalWfhDaysAll,
        topPerformer: employeeSummaries[0] || null,
        tierCounts,
      },
      departmentStats,
      employees: employeeSummaries,
    });
  } catch (error: any) {
    console.error("GET /api/admin/kpi/dashboard error:", error);
    return errorResponse(error.message || "Failed to load KPI dashboard data", 500);
  }
}
