import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import bcrypt from "bcryptjs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const userId = BigInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse(`Employee not found with id: ${id}`, 404);
    }

    return jsonResponse(user);
  } catch (error: any) {
    console.error("GET /api/employees/[id] error:", error);
    return errorResponse(error.message || "Failed to fetch employee", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const userId = BigInt(id);
    const body = await req.json();

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return errorResponse(`Employee not found with id: ${id}`, 404);
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email.trim();
    if (body.employeeCode !== undefined) updateData.employeeCode = body.employeeCode.trim();
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.department !== undefined) updateData.department = body.department?.trim() || "IT";
    if (body.profileData !== undefined) {
      updateData.profileData = typeof body.profileData === "string" ? body.profileData : JSON.stringify(body.profileData);
    }

    if (body.password && body.password.trim() !== "") {
      updateData.password = await bcrypt.hash(body.password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return jsonResponse(updated);
  } catch (error: any) {
    console.error("PUT /api/employees/[id] error:", error);
    return errorResponse(error.message || "Failed to update employee", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const userId = BigInt(id);

    // Delete dependent records first to maintain relational integrity
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { employeeId: userId } }),
      prisma.leaveRequest.deleteMany({ where: { employeeId: userId } }),
      prisma.permissionRequest.deleteMany({ where: { employeeId: userId } }),
      prisma.leaveBalance.deleteMany({ where: { employeeId: userId } }),
      prisma.payroll.deleteMany({ where: { employeeId: userId } }),
      prisma.salaryStructure.deleteMany({ where: { employeeId: userId } }),
      prisma.salaryHistory.deleteMany({ where: { employeeId: userId } }),
      prisma.task.deleteMany({ where: { employeeId: userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return jsonResponse({ success: true, message: `Employee ${id} deleted successfully` });
  } catch (error: any) {
    console.error("DELETE /api/employees/[id] error:", error);
    return errorResponse(error.message || "Failed to delete employee", 500);
  }
}
