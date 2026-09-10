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
    const dateQuery = searchParams.get("date");
    const now = dateQuery ? new Date(dateQuery) : new Date();

    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    const bufferStart = new Date(startOfDay.getTime() - 14 * 3600 * 1000);
    const bufferEnd = new Date(endOfDay.getTime() + 14 * 3600 * 1000);

    const empId = BigInt(authUser.id);

    // Fetch work plans for today
    const plans = await prisma.dailyWorkPlan.findMany({
      where: {
        employeeId: empId,
        planDate: {
          gte: bufferStart,
          lte: bufferEnd,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    // Fetch daily note & kpi score
    const note = await prisma.dailyWorkNote.findFirst({
      where: {
        employeeId: empId,
        noteDate: {
          gte: bufferStart,
          lte: bufferEnd,
        },
      },
    });

    // Fetch attendance for today
    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: empId,
        attendanceDate: {
          gte: bufferStart,
          lte: bufferEnd,
        },
      },
      orderBy: { id: "desc" },
    });

    // Calculate Summary Metrics
    const totalTasks = plans.length;
    const completedCount = plans.filter((p) => p.status === "COMPLETED").length;
    const inProgressCount = plans.filter((p) => p.status === "IN_PROGRESS").length;
    const notCompletedCount = plans.filter((p) => p.status === "NOT_COMPLETED").length;
    const notStartedCount = plans.filter((p) => p.status === "NOT_STARTED").length;

    const highPriorityCount = plans.filter((p) => p.priority === "HIGH").length;
    const mediumPriorityCount = plans.filter((p) => p.priority === "MEDIUM").length;
    const lowPriorityCount = plans.filter((p) => p.priority === "LOW").length;
    const notSetPriorityCount = plans.filter((p) => p.priority === "NOT_SET").length;

    // Calculate KPI Score:
    // Completed: 100%, In-Progress: 50%, Not Completed: 0%
    let calculatedKpi = 0; // default baseline 0
    let kpiLabel = "No Tasks";
    if (totalTasks > 0) {
      calculatedKpi = Math.round(((completedCount * 100 + inProgressCount * 50) / totalTasks));
      if (calculatedKpi >= 90) kpiLabel = "Excellent";
      else if (calculatedKpi >= 80) kpiLabel = "Very Good";
      else if (calculatedKpi >= 70) kpiLabel = "Good";
      else if (calculatedKpi >= 60) kpiLabel = "Needs Attention";
      else kpiLabel = "At Risk";
    } else if (note?.kpiScore !== null && note?.kpiScore !== undefined) {
      calculatedKpi = note.kpiScore;
      if (calculatedKpi >= 90) kpiLabel = "Excellent";
      else if (calculatedKpi >= 80) kpiLabel = "Very Good";
      else if (calculatedKpi >= 70) kpiLabel = "Good";
      else if (calculatedKpi >= 60) kpiLabel = "Needs Attention";
      else if (calculatedKpi > 0) kpiLabel = "At Risk";
      else kpiLabel = "No Tasks";
    }

    // Format check in / out times
    let checkInTime = "--:--";
    let checkOutTime = "--:--";
    let workHoursFormatted = "--";

    if (attendance?.loginTime) {
      const d = new Date(attendance.loginTime);
      checkInTime = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    if (attendance?.logoutTime) {
      const d = new Date(attendance.logoutTime);
      checkOutTime = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
    if (attendance?.loginTime && attendance?.logoutTime) {
      const diffMs = new Date(attendance.logoutTime).getTime() - new Date(attendance.loginTime).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      workHoursFormatted = `${diffHrs}h ${diffMins}m`;
    } else if (attendance?.loginTime) {
      const diffMs = new Date().getTime() - new Date(attendance.loginTime).getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      workHoursFormatted = `${diffHrs}h ${diffMins}m (active)`;
    }

    return jsonResponse({
      date: now.toISOString().split("T")[0],
      employee: {
        id: Number(authUser.id),
        name: authUser.name,
        email: authUser.email,
        employeeCode: authUser.employeeCode,
        role: authUser.role,
        department: authUser.department,
      },
      summary: {
        totalTasks,
        completedCount,
        inProgressCount,
        notCompletedCount,
        notStartedCount,
        highPriorityCount,
        mediumPriorityCount,
        lowPriorityCount,
        notSetPriorityCount,
        kpiScore: calculatedKpi,
        kpiLabel,
        checkInTime,
        checkOutTime,
        workHoursFormatted,
      },
      plans: plans.map(formatWorkPlan),
      note: note ? formatWorkNote(note) : null,
      attendance: attendance
        ? {
            id: Number(attendance.id),
            status: attendance.status,
            timingStatus: attendance.timingStatus,
            loginTime: attendance.loginTime?.toISOString(),
            logoutTime: attendance.logoutTime?.toISOString(),
          }
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/work-plans/today error:", error);
    return errorResponse(error.message || "Failed to load today's work plans", 500);
  }
}
