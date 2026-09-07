import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkPlan } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const now = dateParam ? new Date(dateParam) : new Date();

    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    const plans = await prisma.dailyWorkPlan.findMany({
      where: {
        employeeId: BigInt(authUser.id),
        planDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return jsonResponse(plans.map(formatWorkPlan));
  } catch (error: any) {
    console.error("GET /api/work-plans error:", error);
    return errorResponse(error.message || "Failed to fetch work plans", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const taskName = body.taskName?.trim();

    if (!taskName) {
      return errorResponse("Task name is required", 400);
    }

    const now = body.planDate ? new Date(body.planDate) : new Date();
    const planDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Get current count for sort order
    const count = await prisma.dailyWorkPlan.count({
      where: {
        employeeId: BigInt(authUser.id),
        planDate,
      },
    });

    const newPlan = await prisma.dailyWorkPlan.create({
      data: {
        employeeId: BigInt(authUser.id),
        planDate,
        taskName,
        category: body.category || "Development",
        priority: body.priority || "MEDIUM",
        targetDescription: body.targetDescription?.trim() || "",
        remarks: body.remarks?.trim() || "",
        status: body.status || "NOT_STARTED",
        sortOrder: count + 1,
      },
    });

    return jsonResponse(formatWorkPlan(newPlan), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/work-plans error:", error);
    return errorResponse(error.message || "Failed to create work plan", 500);
  }
}
