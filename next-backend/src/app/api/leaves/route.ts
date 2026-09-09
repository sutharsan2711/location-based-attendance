import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLeave, calculateEmployeeLeaveBalance } from "@/lib/formatters";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const leaveType = body.leaveType;
    const fromDateStr = body.fromDate;
    const toDateStr = body.toDate;
    const reason = body.reason?.trim();

    // Allow Admin to apply/grant on behalf of any employee
    const targetEmployeeId =
      isUserAdmin(authUser) && body.employeeId
        ? BigInt(body.employeeId)
        : BigInt(authUser.id);

    const targetEmp = await prisma.user.findUnique({
      where: { id: targetEmployeeId },
    });

    if (!targetEmp) {
      return errorResponse("Employee not found", 404);
    }

    if (!leaveType || !fromDateStr || !toDateStr || !reason) {
      return errorResponse("Leave type, dates, and reason are required", 400);
    }

    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return errorResponse("Invalid dates provided", 400);
    }

    if (toDate < fromDate) {
      return errorResponse("To Date cannot be before From Date", 400);
    }

    const isHalfDay = Boolean(body.isHalfDay);
    const diffMs = toDate.getTime() - fromDate.getTime();
    const totalCalendarDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const requestedDays = isHalfDay ? 0.5 : Math.max(1, totalCalendarDays);

    // If applying for COMP_OFF, validate that employee has sufficient earned COF balance
    if (leaveType === "COMP_OFF") {
      const year = fromDate.getFullYear();
      const balanceSummary = await calculateEmployeeLeaveBalance(targetEmp, year);
      const compOffBal = balanceSummary.balances.find((b) => b.type === "COMP_OFF");
      const availableCompOff = compOffBal ? compOffBal.balance : 0;

      if (availableCompOff < requestedDays && !isUserAdmin(authUser)) {
        return errorResponse(
          `Insufficient Comp Off balance. You currently have ${availableCompOff} day(s) available, but requested ${requestedDays} day(s). Comp Off is earned by working on company holidays or by Admin grant.`,
          400
        );
      }
    }

    const status = isUserAdmin(authUser) && body.status ? body.status : "PENDING";
    const adminRemarks = isUserAdmin(authUser) ? body.adminRemarks || "Directly assigned by Admin" : null;

    const created = await prisma.leaveRequest.create({
      data: {
        employeeId: targetEmployeeId,
        leaveType,
        fromDate,
        toDate,
        isHalfDay,
        halfDaySession: body.halfDaySession || null,
        reason,
        remarks: body.remarks?.trim() || null,
        adminRemarks,
        status,
      },
      include: { employee: true },
    });

    return jsonResponse(formatLeave(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/leaves error:", error);
    return errorResponse(error.message || "Failed to apply leave", 500);
  }
}
