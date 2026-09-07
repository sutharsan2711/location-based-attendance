import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatPayroll } from "@/lib/formatters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const payrollId = BigInt(id);
    const body = await req.json();
    const status = body.status;

    if (!status || !["GENERATED", "PAID"].includes(status.toUpperCase())) {
      return errorResponse("Invalid status. Expected GENERATED or PAID", 400);
    }

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: status.toUpperCase(),
        paidAt: status.toUpperCase() === "PAID" ? new Date() : null,
      },
      include: { employee: true },
    });

    return jsonResponse(formatPayroll(updated));
  } catch (error: any) {
    console.error("PATCH /api/payroll/[id]/status error:", error);
    return errorResponse(error.message || "Failed to update payroll status", 500);
  }
}
