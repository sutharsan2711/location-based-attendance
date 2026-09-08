import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan, formatWorkNote } from "@/lib/formatters";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const targetEmpId = BigInt(id);

    const employee = await prisma.user.findUnique({
      where: { id: targetEmpId },
      select: {
        id: true,
        name: true,
        email: true,
        employeeCode: true,
        department: true,
        role: true,
        status: true,
        phone: true,
      },
    });

    if (!employee) {
      return errorResponse("Employee not found", 404);
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");

    const now = new Date();
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    // 1. Fetch Planned Works (DailyWorkPlan)
    const plans = await prisma.dailyWorkPlan.findMany({
      where: {
        employeeId: targetEmpId,
        planDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: [{ planDate: "desc" }, { sortOrder: "asc" }],
    });

    // 2. Fetch Unplanned Works (Assigned Tasks)
    const tasks = await prisma.task.findMany({
      where: {
        employeeId: targetEmpId,
        OR: [
          { createdAt: { gte: startOfMonth, lte: endOfMonth } },
          { dueDate: { gte: startOfMonth, lte: endOfMonth } },
          { startDate: { gte: startOfMonth, lte: endOfMonth } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch Attendance & Login Times
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: targetEmpId,
        attendanceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { attendanceDate: "desc" },
    });

    // 4. Fetch WFH / Leave Requests
    const wfhRequests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: targetEmpId,
        leaveType: "WORK_FROM_HOME",
        OR: [
          { fromDate: { gte: startOfMonth, lte: endOfMonth } },
          { toDate: { gte: startOfMonth, lte: endOfMonth } },
        ],
      },
      orderBy: { fromDate: "desc" },
    });

    // 5. Fetch Daily Notes
    const notes = await prisma.dailyWorkNote.findMany({
      where: {
        employeeId: targetEmpId,
        noteDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { noteDate: "desc" },
    });

    // --- COMPUTATIONS ---

    // A. Planned Works Metrics
    const totalPlanned = plans.length;
    const completedPlanned = plans.filter((p) => p.status === "COMPLETED").length;
    const inProgressPlanned = plans.filter((p) => p.status === "IN_PROGRESS").length;
    const notCompletedPlanned = plans.filter((p) => p.status === "NOT_COMPLETED").length;
    const notStartedPlanned = plans.filter((p) => p.status === "NOT_STARTED").length;
    const plannedCompletionRate =
      totalPlanned > 0 ? Math.round((completedPlanned / totalPlanned) * 100) : 0;
    const plannedScore =
      totalPlanned > 0
        ? Math.round((completedPlanned * 100 + inProgressPlanned * 50) / totalPlanned)
        : 85;

    const plannedByPriority = {
      urgent: plans.filter((p) => p.priority === "URGENT").length,
      high: plans.filter((p) => p.priority === "HIGH").length,
      medium: plans.filter((p) => p.priority === "MEDIUM").length,
      low: plans.filter((p) => p.priority === "LOW").length,
    };

    const plannedByCategory: Record<string, number> = {};
    plans.forEach((p) => {
      const cat = p.category || "General";
      plannedByCategory[cat] = (plannedByCategory[cat] || 0) + 1;
    });

    // B. Unplanned Works Metrics
    const totalUnplanned = tasks.length;
    const completedUnplanned = tasks.filter((t) => t.status === "COMPLETED").length;
    const inProgressUnplanned = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const underReviewUnplanned = tasks.filter((t) => t.status === "UNDER_REVIEW").length;
    const pendingUnplanned = tasks.filter((t) => t.status === "PENDING").length;
    const cancelledUnplanned = tasks.filter((t) => t.status === "CANCELLED").length;
    const unplannedCompletionRate =
      totalUnplanned > 0 ? Math.round((completedUnplanned / totalUnplanned) * 100) : 0;
    const unplannedScore =
      totalUnplanned > 0
        ? Math.round(
            (completedUnplanned * 100 + underReviewUnplanned * 75 + inProgressUnplanned * 50) /
              totalUnplanned
          )
        : 90;

    const unplannedByPriority = {
      urgent: tasks.filter((t) => t.priority === "URGENT").length,
      high: tasks.filter((t) => t.priority === "HIGH").length,
      medium: tasks.filter((t) => t.priority === "MEDIUM").length,
      low: tasks.filter((t) => t.priority === "LOW").length,
    };

    // C. Login Time & Punctuality Metrics
    const totalLoggedDays = attendances.filter(
      (a) => a.status === "LOGGED_IN" || a.status === "COMPLETED"
    ).length;
    const onTimeDays = attendances.filter((a) => a.timingStatus === "PRESENT").length;
    const lateDays = attendances.filter((a) => a.timingStatus === "LATE").length;
    const permissionDays = attendances.filter((a) => a.timingStatus === "PERMISSION").length;
    const leaveDays = attendances.filter((a) => a.timingStatus === "LEAVE").length;
    const absentDays = attendances.filter((a) => a.timingStatus === "ABSENT").length;

    const punctualityRate =
      totalLoggedDays > 0 ? Math.round((onTimeDays / totalLoggedDays) * 100) : 0;
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

    // Calculate avg login/logout and hours
    let totalLoginMinutes = 0;
    let loginCount = 0;
    let totalLogoutMinutes = 0;
    let logoutCount = 0;
    let totalWorkHoursSum = 0;

    attendances.forEach((a) => {
      if (a.loginTime) {
        const d = new Date(a.loginTime);
        totalLoginMinutes += d.getHours() * 60 + d.getMinutes();
        loginCount++;
      }
      if (a.logoutTime) {
        const d = new Date(a.logoutTime);
        totalLogoutMinutes += d.getHours() * 60 + d.getMinutes();
        logoutCount++;
      }
      if (a.loginTime && a.logoutTime) {
        const diffHrs =
          (new Date(a.logoutTime).getTime() - new Date(a.loginTime).getTime()) / (1000 * 60 * 60);
        if (diffHrs > 0 && diffHrs < 24) {
          totalWorkHoursSum += diffHrs;
        }
      }
    });

    const formatTimeFromMinutes = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      const period = h >= 12 ? "PM" : "AM";
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return `${String(displayH).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
    };

    const avgLoginTime = loginCount > 0 ? formatTimeFromMinutes(totalLoginMinutes / loginCount) : "--:--";
    const avgLogoutTime = logoutCount > 0 ? formatTimeFromMinutes(totalLogoutMinutes / logoutCount) : "--:--";
    const avgDailyHours = totalLoggedDays > 0 ? Number((totalWorkHoursSum / totalLoggedDays).toFixed(1)) : 0;

    // D. WFH Details
    const approvedWfhRequests = wfhRequests.filter((r) => r.status === "APPROVED");
    const pendingWfhRequests = wfhRequests.filter((r) => r.status === "PENDING");
    const rejectedWfhRequests = wfhRequests.filter((r) => r.status === "REJECTED");

    let totalWfhDays = 0;
    approvedWfhRequests.forEach((r) => {
      const start = new Date(Math.max(r.fromDate.getTime(), startOfMonth.getTime()));
      const end = new Date(Math.min(r.toDate.getTime(), endOfMonth.getTime()));
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      totalWfhDays += days;
    });

    const wfhPunches = attendances.filter((a) => (a.loginDistance && a.loginDistance > 150) || false);
    const wfhScore =
      wfhRequests.length > 0
        ? Math.round((approvedWfhRequests.length / wfhRequests.length) * 100)
        : 100;

    // E. Daily Work Notes Score
    const validKpis = notes.filter((n) => n.kpiScore !== null).map((n) => n.kpiScore as number);
    const notesScore =
      validKpis.length > 0
        ? Math.round(validKpis.reduce((a, b) => a + b, 0) / validKpis.length)
        : plannedScore;

    // F. Composite Overall Score
    const overallScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          plannedScore * 0.35 +
            unplannedScore * 0.25 +
            punctualityScore * 0.2 +
            notesScore * 0.1 +
            (totalLoggedDays >= 10 ? 10 : 6)
        )
      )
    );

    let performanceTier = "Good";
    let tierBadge = "Tier 3 - Good";
    let tierColor = "indigo";
    if (overallScore >= 90) {
      performanceTier = "Outstanding";
      tierBadge = "Tier 1 - Outstanding Performer";
      tierColor = "emerald";
    } else if (overallScore >= 80) {
      performanceTier = "Excellent";
      tierBadge = "Tier 2 - Excellent";
      tierColor = "cyan";
    } else if (overallScore >= 70) {
      performanceTier = "Good";
      tierBadge = "Tier 3 - Consistent";
      tierColor = "indigo";
    } else if (overallScore >= 60) {
      performanceTier = "Needs Attention";
      tierBadge = "Tier 4 - Needs Improvement";
      tierColor = "amber";
    } else {
      performanceTier = "Critical";
      tierBadge = "Tier 5 - Critical Attention";
      tierColor = "rose";
    }

    // Dynamic Summary Insights
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (plannedCompletionRate >= 85) strengths.push(`High planned task completion rate (${plannedCompletionRate}%).`);
    else if (plannedCompletionRate < 65) improvements.push(`Planned work completion is below target (${plannedCompletionRate}%).`);

    if (punctualityRate >= 90) strengths.push(`Exceptional punctuality record with ${onTimeDays} on-time arrivals.`);
    else if (lateDays >= 3) improvements.push(`Logged late ${lateDays} times this month. Needs punctuality alignment.`);

    if (unplannedCompletionRate >= 80 && totalUnplanned > 0) strengths.push(`Strong responsiveness to ad-hoc/admin-assigned tasks (${unplannedCompletionRate}%).`);
    else if (totalUnplanned > 0 && unplannedCompletionRate < 60) improvements.push(`Unplanned/assigned tasks backlog is high.`);

    if (totalWfhDays > 0) strengths.push(`Maintained active productivity over ${totalWfhDays} Work-From-Home days.`);

    if (strengths.length === 0) strengths.push("Regular daily attendance and continuous task engagement.");
    if (improvements.length === 0) improvements.push("Maintain consistent high performance and timely task submission.");

    // G. Build Day-by-Day Timeline
    const daysMap = new Map<string, any>();
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      daysMap.set(dayStr, {
        date: dayStr,
        dayNumber: d,
        plans: [],
        tasks: [],
        note: null,
        attendance: null,
        isWfh: false,
        kpiScore: 0,
        kpiLabel: "No Activity",
      });
    }

    plans.forEach((p) => {
      const dStr = p.planDate.toISOString().split("T")[0];
      const entry = daysMap.get(dStr);
      if (entry) entry.plans.push(formatWorkPlan(p));
    });

    tasks.forEach((t) => {
      const dateTarget = t.dueDate || t.createdAt;
      if (dateTarget) {
        const dStr = dateTarget.toISOString().split("T")[0];
        const entry = daysMap.get(dStr);
        if (entry) {
          entry.tasks.push({
            id: Number(t.id),
            title: t.title,
            priority: t.priority,
            status: t.status,
            dueDate: t.dueDate?.toISOString(),
          });
        }
      }
    });

    notes.forEach((n) => {
      const dStr = n.noteDate.toISOString().split("T")[0];
      const entry = daysMap.get(dStr);
      if (entry) entry.note = formatWorkNote(n);
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
          distance: a.loginDistance,
          accuracy: a.loginAccuracy,
        };
      }
    });

    // Check WFH days in map
    approvedWfhRequests.forEach((r) => {
      const start = new Date(Math.max(r.fromDate.getTime(), startOfMonth.getTime()));
      const end = new Date(Math.min(r.toDate.getTime(), endOfMonth.getTime()));
      for (let cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
        const dStr = cur.toISOString().split("T")[0];
        const entry = daysMap.get(dStr);
        if (entry) entry.isWfh = true;
      }
    });

    const dailyTimeline = Array.from(daysMap.values()).map((day) => {
      const pCount = day.plans.length;
      const compCount = day.plans.filter((p: any) => p.status === "COMPLETED").length;
      let dayScore = 0;
      if (pCount > 0) {
        dayScore = Math.round((compCount / pCount) * 100);
      } else if (day.note?.kpiScore) {
        dayScore = day.note.kpiScore;
      } else if (day.attendance?.status === "LOGGED_IN" || day.attendance?.status === "COMPLETED") {
        dayScore = 80;
      }
      day.kpiScore = dayScore;
      return day;
    });

    return jsonResponse({
      year,
      month,
      employee: {
        id: Number(employee.id),
        name: employee.name,
        email: employee.email,
        employeeCode: employee.employeeCode,
        department: employee.department || "General",
        role: employee.role,
        phone: employee.phone || "N/A",
      },
      overallPerformance: {
        score: overallScore,
        tier: performanceTier,
        tierBadge,
        tierColor,
        strengths,
        improvements,
        componentBreakdown: {
          plannedWorksWeight: "35%",
          plannedWorksScore: plannedScore,
          unplannedWorksWeight: "25%",
          unplannedWorksScore: unplannedScore,
          punctualityWeight: "20%",
          punctualityScore: punctualityScore,
          consistencyWeight: "10%",
          consistencyScore: notesScore,
          attendanceWeight: "10%",
          attendanceScore: totalLoggedDays >= 10 ? 100 : 70,
        },
      },
      plannedWorks: {
        score: plannedScore,
        totalPlanned,
        completed: completedPlanned,
        inProgress: inProgressPlanned,
        notCompleted: notCompletedPlanned,
        notStarted: notStartedPlanned,
        completionRate: plannedCompletionRate,
        byPriority: plannedByPriority,
        byCategory: plannedByCategory,
        tasks: plans.map(formatWorkPlan),
      },
      unplannedWorks: {
        score: unplannedScore,
        totalUnplanned,
        completed: completedUnplanned,
        inProgress: inProgressUnplanned,
        underReview: underReviewUnplanned,
        pending: pendingUnplanned,
        cancelled: cancelledUnplanned,
        completionRate: unplannedCompletionRate,
        byPriority: unplannedByPriority,
        tasks: tasks.map((t) => ({
          id: Number(t.id),
          title: t.title,
          description: t.description,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate?.toISOString(),
          createdAt: t.createdAt?.toISOString(),
          completionNotes: t.completionNotes,
          assignedByName: t.assignedByName,
        })),
      },
      loginAndPunctuality: {
        score: punctualityScore,
        totalLoggedDays,
        onTimeDays,
        lateDays,
        permissionDays,
        leaveDays,
        absentDays,
        punctualityRate,
        avgLoginTime,
        avgLogoutTime,
        avgDailyHours,
        totalHoursLogged: Number(totalWorkHoursSum.toFixed(1)),
        logs: attendances.map((a) => ({
          id: Number(a.id),
          date: a.attendanceDate.toISOString().split("T")[0],
          loginTime: a.loginTime?.toISOString(),
          logoutTime: a.logoutTime?.toISOString(),
          status: a.status,
          timingStatus: a.timingStatus,
          distance: a.loginDistance,
          accuracy: a.loginAccuracy,
        })),
      },
      workFromHome: {
        score: wfhScore,
        totalRequests: wfhRequests.length,
        approvedDays: totalWfhDays,
        pendingRequests: pendingWfhRequests.length,
        rejectedRequests: rejectedWfhRequests.length,
        remotePunchesCount: wfhPunches.length,
        requests: wfhRequests.map((r) => ({
          id: Number(r.id),
          fromDate: r.fromDate.toISOString().split("T")[0],
          toDate: r.toDate.toISOString().split("T")[0],
          status: r.status,
          reason: r.reason || r.remarks || "Work From Home Request",
          adminRemarks: r.adminRemarks,
          createdAt: r.createdAt?.toISOString(),
        })),
      },
      dailyTimeline,
    });
  } catch (error: any) {
    console.error("GET /api/admin/kpi/employee/[id] error:", error);
    return errorResponse(error.message || "Failed to load comprehensive KPI report", 500);
  }
}
