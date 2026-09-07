import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const employeeIdParam = searchParams.get("employeeId");

    const targetEmployeeId = employeeIdParam ? BigInt(employeeIdParam) : BigInt(authUser.id);

    const whereClause: any = {
      employeeId: targetEmployeeId,
    };

    if (startDateParam && endDateParam) {
      whereClause.attendanceDate = {
        gte: new Date(startDateParam),
        lte: new Date(endDateParam),
      };
    }

    const history = await prisma.attendance.findMany({
      where: whereClause,
      orderBy: { attendanceDate: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeCode: true,
            department: true,
            role: true,
            status: true,
          },
        },
      },
    });

    return jsonResponse(history);
  } catch (error: any) {
    console.error("GET /api/attendance/history error:", error);
    return errorResponse(error.message || "Failed to fetch attendance history", 500);
  }
}
