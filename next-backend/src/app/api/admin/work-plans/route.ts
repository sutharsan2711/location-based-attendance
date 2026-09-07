import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const employeeIdParam = searchParams.get("employeeId");
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search");

    const whereClause: any = {};

    if (dateParam && dateParam !== "ALL") {
      const targetDate = new Date(dateParam);
      const startOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0));
      const endOfDay = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));
      whereClause.planDate = { gte: startOfDay, lte: endOfDay };
    }

    if (employeeIdParam && employeeIdParam !== "ALL") {
      whereClause.employeeId = BigInt(employeeIdParam);
    }

    if (statusParam && statusParam !== "ALL") {
      whereClause.status = statusParam;
    }

    if (priorityParam && priorityParam !== "ALL") {
      whereClause.priority = priorityParam;
    }

    if (categoryParam && categoryParam !== "ALL") {
      whereClause.category = categoryParam;
    }

    if (searchParam) {
      whereClause.OR = [
        { taskName: { contains: searchParam } },
        { targetDescription: { contains: searchParam } },
        { remarks: { contains: searchParam } },
        { employee: { name: { contains: searchParam } } },
        { employee: { employeeCode: { contains: searchParam } } },
      ];
    }

    const plans = await prisma.dailyWorkPlan.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            employeeCode: true,
            email: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: [{ planDate: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    });

    const totalPlans = plans.length;
    const completedPlans = plans.filter((p) => p.status === "COMPLETED").length;
    const inProgressPlans = plans.filter((p) => p.status === "IN_PROGRESS").length;
    const notStartedPlans = plans.filter((p) => p.status === "NOT_STARTED").length;
    const holdPlans = plans.filter((p) => p.status === "HOLD" || p.status === "BLOCKED").length;

    const kpiAverage = totalPlans > 0
      ? Math.round(((completedPlans * 100 + inProgressPlans * 50) / totalPlans))
      : 0;

    return jsonResponse({
      plans: plans.map(formatWorkPlan),
      summary: {
        totalPlans,
        completedPlans,
        inProgressPlans,
        notStartedPlans,
        holdPlans,
        kpiAverage,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/work-plans error:", error);
    return errorResponse(error.message || "Failed to fetch work plans", 500);
  }
}
