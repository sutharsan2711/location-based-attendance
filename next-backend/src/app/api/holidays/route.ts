import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatHoliday } from "@/lib/formatters";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    const whereClause: any = {};
    if (yearParam) {
      const y = parseInt(yearParam, 10);
      whereClause.holidayDate = {
        gte: new Date(y, 0, 1),
        lte: new Date(y, 11, 31),
      };
    }

    const holidays = await prisma.holiday.findMany({
      where: whereClause,
      orderBy: { holidayDate: "asc" },
    });

    return jsonResponse(holidays.map(formatHoliday));
  } catch (error: any) {
    console.error("GET /api/holidays error:", error);
    return errorResponse(error.message || "Failed to fetch holidays", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const name = body.name?.trim();
    const dateStr = body.holidayDate || body.date;

    if (!name || !dateStr) {
      return errorResponse("Holiday name and date are required", 400);
    }

    const holidayDate = new Date(dateStr);
    const dayOfWeek = body.dayOfWeek || DAY_NAMES[holidayDate.getDay()];

    const created = await prisma.holiday.create({
      data: {
        name,
        holidayDate,
        dayOfWeek,
        holidayType: body.holidayType?.trim() || "Company Holiday",
        description: body.description?.trim() || null,
        isOptional: body.isOptional ?? false,
      },
    });

    return jsonResponse(
      {
        success: true,
        message: "Holiday created successfully",
        holiday: formatHoliday(created),
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/holidays error:", error);
    return errorResponse(error.message || "Failed to create holiday", 500);
  }
}
