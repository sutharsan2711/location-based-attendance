import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan, formatWorkNote } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month"); // 1-indexed (1-12)

    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const empId = BigInt(authUser.id);

    // Fetch all work plans for the month
    const plans = await prisma.dailyWorkPlan.findMany({
      where: {
        employeeId: empId,
        planDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: [{ planDate: "asc" }, { sortOrder: "asc" }],
    });

    // Fetch all notes for the month
    const notes = await prisma.dailyWorkNote.findMany({
      where: {
        employeeId: empId,
        noteDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { noteDate: "asc" },
    });

    // Fetch attendance for the month
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: empId,
        attendanceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { attendanceDate: "asc" },
    });

    // Group by day (YYYY-MM-DD)
    const daysMap = new Map<
      string,
      {
        date: string;
        plans: any[];
        note: any | null;
        attendance: any | null;
        kpiScore: number;
        kpiLabel: string;
        totalTasks: number;
        completedCount: number;
        inProgressCount: number;
        notCompletedCount: number;
      }
    >();

    // Number of days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      daysMap.set(dayStr, {
        date: dayStr,
        plans: [],
        note: null,
        attendance: null,
        kpiScore: 0,
        kpiLabel: "No Tasks",
        totalTasks: 0,
        completedCount: 0,
        inProgressCount: 0,
        notCompletedCount: 0,
      });
    }

    plans.forEach((p) => {
      const dStr = p.planDate.toISOString().split("T")[0];
      const entry = daysMap.get(dStr);
      if (entry) {
        entry.plans.push(formatWorkPlan(p));
      }
    });

    notes.forEach((n) => {
      const dStr = n.noteDate.toISOString().split("T")[0];
      const entry = daysMap.get(dStr);
      if (entry) {
        entry.note = formatWorkNote(n);
      }
    });

    attendances.forEach((a) => {
      const dStr = a.attendanceDate.toISOString().split("T")[0];
      const entry = daysMap.get(dStr);
      if (entry) {
        entry.attendance = {
          id: Number(a.id),
          status: a.status,
          timingStatus: a.timingStatus,
          loginTime: a.loginTime?.toISOString(),
          logoutTime: a.logoutTime?.toISOString(),
        };
      }
    });

    let totalMonthlyTasks = 0;
    let totalCompletedTasks = 0;
    let totalInProgressTasks = 0;
    let totalNotCompletedTasks = 0;
    const scoredDays: number[] = [];

    const dailyBreakdown = Array.from(daysMap.values()).map((day) => {
      const dayTasks = day.plans.length;
      const completed = day.plans.filter((p) => p.status === "COMPLETED").length;
      const inProgress = day.plans.filter((p) => p.status === "IN_PROGRESS").length;
      const notCompleted = day.plans.filter((p) => p.status === "NOT_COMPLETED").length;

      day.totalTasks = dayTasks;
      day.completedCount = completed;
      day.inProgressCount = inProgress;
      day.notCompletedCount = notCompleted;

      totalMonthlyTasks += dayTasks;
      totalCompletedTasks += completed;
      totalInProgressTasks += inProgress;
      totalNotCompletedTasks += notCompleted;

      let score = 0;
      if (dayTasks > 0) {
        score = Math.round(((completed * 100 + inProgress * 50) / dayTasks));
        scoredDays.push(score);
      } else if (day.note?.kpiScore !== null && day.note?.kpiScore !== undefined) {
        score = day.note.kpiScore;
        scoredDays.push(score);
      }

      let label = "No Tasks";
      if (dayTasks > 0 || (day.note?.kpiScore !== null && day.note?.kpiScore !== undefined)) {
        if (score >= 90) label = "Excellent";
        else if (score >= 80) label = "Very Good";
        else if (score >= 70) label = "Good";
        else if (score >= 60) label = "Needs Attention";
        else label = "At Risk";
      }

      day.kpiScore = score;
      day.kpiLabel = label;
      return day;
    });

    const averageKpiScore =
      scoredDays.length > 0
        ? Math.round(scoredDays.reduce((a, b) => a + b, 0) / scoredDays.length)
        : totalMonthlyTasks > 0
        ? Math.round(((totalCompletedTasks * 100 + totalInProgressTasks * 50) / totalMonthlyTasks))
        : 80;

    let monthlyLabel = "Good";
    if (averageKpiScore >= 90) monthlyLabel = "Excellent";
    else if (averageKpiScore >= 80) monthlyLabel = "Very Good";
    else if (averageKpiScore >= 70) monthlyLabel = "Good";
    else if (averageKpiScore >= 60) monthlyLabel = "Needs Attention";
    else monthlyLabel = "At Risk";

    return jsonResponse({
      year,
      month,
      employee: {
        id: Number(authUser.id),
        name: authUser.name,
        email: authUser.email,
        employeeCode: authUser.employeeCode,
        department: authUser.department,
      },
      summary: {
        averageKpiScore,
        monthlyLabel,
        totalMonthlyTasks,
        totalCompletedTasks,
        totalInProgressTasks,
        totalNotCompletedTasks,
        completionRate:
          totalMonthlyTasks > 0 ? Math.round((totalCompletedTasks / totalMonthlyTasks) * 100) : 0,
        activeWorkDays: scoredDays.length,
        presentDays: attendances.filter((a) => a.status === "LOGGED_IN" || a.status === "COMPLETED").length,
        onTimeDays: attendances.filter((a) => a.timingStatus === "PRESENT").length,
      },
      dailyBreakdown,
    });
  } catch (error: any) {
    console.error("GET /api/work-plans/monthly error:", error);
    return errorResponse(error.message || "Failed to fetch monthly KPI", 500);
  }
}
