import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatTask } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const priorityParam = searchParams.get("priority");
    const departmentParam = searchParams.get("department");
    const employeeIdParam = searchParams.get("employeeId");

    const whereClause: any = {};

    if (statusParam) whereClause.status = statusParam;
    if (priorityParam) whereClause.priority = priorityParam;
    if (departmentParam) whereClause.department = departmentParam;
    if (employeeIdParam) whereClause.employeeId = BigInt(employeeIdParam);

    // If regular employee, only show their tasks
    if (!isUserAdmin(authUser)) {
      whereClause.employeeId = BigInt(authUser.id);
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        assignedEmployee: true,
        assignedBy: true,
      },
    });

    return jsonResponse(tasks.map(formatTask));
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return errorResponse(error.message || "Failed to fetch tasks", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required to create tasks", 403);
    }

    const body = await req.json();
    const title = body.title?.trim();
    const employeeId = Number(body.assignedEmployeeId || body.employeeId);

    if (!title) {
      return errorResponse("Task title is required", 400);
    }

    if (!employeeId || isNaN(employeeId)) {
      return errorResponse("Assigned employee ID is required", 400);
    }

    const assignedEmployee = await prisma.user.findUnique({
      where: { id: BigInt(employeeId) },
    });

    if (!assignedEmployee) {
      return errorResponse(`Employee not found with id: ${employeeId}`, 404);
    }

    const assignerName = (body.assignedByName || body.whoAssigned || authUser.name || "System Admin").trim();

    const createdTask = await prisma.task.create({
      data: {
        title,
        description: body.description?.trim() || null,
        employeeId: BigInt(employeeId),
        assignedById: BigInt(authUser.id),
        assignedByName: assignerName,
        department: body.department?.trim() || assignedEmployee.department || "IT",
        priority: body.priority || "MEDIUM",
        status: body.status || "PENDING",
        startDate: body.startDate ? new Date(body.startDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completionNotes: body.completionNotes || null,
        checklistJson: body.checklistJson || null,
      },
      include: {
        assignedEmployee: true,
        assignedBy: true,
      },
    });

    return jsonResponse(formatTask(createdTask), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return errorResponse(error.message || "Failed to create task", 500);
  }
}
