import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLeave } from "@/lib/formatters";

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

    if (!leaveType || !fromDateStr || !toDateStr || !reason) {
      return errorResponse("Leave type, dates, and reason are required", 400);
    }

    const fromDate = new Date(fromDateStr);
    const toDate = new Date(toDateStr);

    const created = await prisma.leaveRequest.create({
      data: {
        employeeId: BigInt(authUser.id),
        leaveType,
        fromDate,
        toDate,
        isHalfDay: body.isHalfDay ?? false,
        halfDaySession: body.halfDaySession || null,
        reason,
        remarks: body.remarks?.trim() || null,
        status: "PENDING",
      },
      include: { employee: true },
    });

    return jsonResponse(formatLeave(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/leaves error:", error);
    return errorResponse(error.message || "Failed to apply leave", 500);
  }
}
