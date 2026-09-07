import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatHoliday } from "@/lib/formatters";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const holidayId = BigInt(id);

    const holiday = await prisma.holiday.findUnique({
      where: { id: holidayId },
    });

    if (!holiday) {
      return errorResponse(`Holiday not found with ID: ${id}`, 404);
    }

    return jsonResponse(formatHoliday(holiday));
  } catch (error: any) {
    console.error("GET /api/holidays/[id] error:", error);
    return errorResponse(error.message || "Failed to fetch holiday", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const holidayId = BigInt(id);
    const body = await req.json();

    const existing = await prisma.holiday.findUnique({ where: { id: holidayId } });
    if (!existing) {
      return errorResponse(`Holiday not found with ID: ${id}`, 404);
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.holidayDate !== undefined || body.date !== undefined) {
      const d = new Date(body.holidayDate || body.date);
      updateData.holidayDate = d;
      updateData.dayOfWeek = DAY_NAMES[d.getDay()];
    }
    if (body.holidayType !== undefined) updateData.holidayType = body.holidayType.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.isOptional !== undefined) updateData.isOptional = body.isOptional;

    const updated = await prisma.holiday.update({
      where: { id: holidayId },
      data: updateData,
    });

    return jsonResponse({
      success: true,
      message: "Holiday updated successfully",
      holiday: formatHoliday(updated),
    });
  } catch (error: any) {
    console.error("PUT /api/holidays/[id] error:", error);
    return errorResponse(error.message || "Failed to update holiday", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const holidayId = BigInt(id);

    await prisma.holiday.delete({
      where: { id: holidayId },
    });

    return jsonResponse({ success: true, message: "Holiday deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/holidays/[id] error:", error);
    return errorResponse(error.message || "Failed to delete holiday", 500);
  }
}
