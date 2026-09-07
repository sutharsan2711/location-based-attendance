import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required for database operations", 403);
    }

    const body = await req.json();
    const code = (body.confirmationCode || "").trim().toUpperCase();

    if (code !== "CONFIRM_RESET" && code !== "CONFIRM_DELETE" && code !== "CONFIRM") {
      return errorResponse("Invalid confirmation code. Please type CONFIRM_RESET to proceed.", 400);
    }

    const type = (body.resetType || "").trim().toUpperCase();

    if (type === "ATTENDANCE") {
      const count = await prisma.attendance.count();
      await prisma.attendance.deleteMany({});
      return jsonResponse({
        success: true,
        message: `Successfully purged ${count} attendance log record(s) from the database.`,
        deletedCount: count,
      });
    }

    if (type === "LEAVES") {
      const permCount = await prisma.permissionRequest.count();
      const leaveCount = await prisma.leaveRequest.count();
      const balCount = await prisma.leaveBalance.count();

      await prisma.$transaction([
        prisma.permissionRequest.deleteMany({}),
        prisma.leaveRequest.deleteMany({}),
        prisma.leaveBalance.deleteMany({}),
      ]);

      const total = permCount + leaveCount + balCount;
      return jsonResponse({
        success: true,
        message: `Successfully cleared all ${total} leave and permission records.`,
        deletedCount: total,
      });
    }

    if (type === "EMPLOYEES") {
      const employees = await prisma.user.findMany({
        where: { role: { not: "ADMIN" } },
      });
      const ids = employees.map((e: any) => e.id);

      await prisma.$transaction([
        prisma.attendance.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.leaveRequest.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.permissionRequest.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.leaveBalance.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.payroll.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.salaryStructure.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.salaryHistory.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.task.deleteMany({ where: { employeeId: { in: ids } } }),
        prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
      ]);

      return jsonResponse({
        success: true,
        message: `Successfully deleted ${employees.length} employee accounts and associated logs.`,
        deletedCount: employees.length,
      });
    }

    if (type === "FULL_SYSTEM_RESET" || type === "FULL_WIPE") {
      await prisma.$transaction([
        prisma.attendance.deleteMany({}),
        prisma.leaveRequest.deleteMany({}),
        prisma.permissionRequest.deleteMany({}),
        prisma.leaveBalance.deleteMany({}),
        prisma.payroll.deleteMany({}),
        prisma.salaryStructure.deleteMany({}),
        prisma.salaryHistory.deleteMany({}),
        prisma.task.deleteMany({}),
        prisma.stickyNote.deleteMany({}),
        prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } }),
      ]);

      return jsonResponse({
        success: true,
        message: "Full system reset completed successfully. All logs and employee records purged.",
      });
    }

    return errorResponse(`Unsupported reset type: ${type}`, 400);
  } catch (error: any) {
    console.error("POST /api/database/reset error:", error);
    return errorResponse(error.message || "Failed to perform database reset", 500);
  }
}
