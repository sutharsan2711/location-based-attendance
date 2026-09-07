import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatPermission, parseTimeToDate } from "@/lib/formatters";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const permissionDateStr = body.permissionDate;
    const fromTimeStr = body.fromTime;
    const toTimeStr = body.toTime;
    const reason = body.reason?.trim();

    if (!permissionDateStr || !fromTimeStr || !toTimeStr || !reason) {
      return errorResponse("Date, from time, to time, and reason are required", 400);
    }

    const permissionDate = new Date(permissionDateStr);
    const fromTime = parseTimeToDate(fromTimeStr, "09:00:00");
    const toTime = parseTimeToDate(toTimeStr, "10:00:00");

    const created = await prisma.permissionRequest.create({
      data: {
        employeeId: BigInt(authUser.id),
        permissionDate,
        fromTime,
        toTime,
        reason,
        remarks: body.remarks?.trim() || null,
        status: "PENDING",
      },
      include: { employee: true },
    });

    return jsonResponse(formatPermission(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/permissions error:", error);
    return errorResponse(error.message || "Failed to apply permission", 500);
  }
}
