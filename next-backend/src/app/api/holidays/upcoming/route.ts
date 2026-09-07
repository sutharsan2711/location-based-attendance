import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatHoliday } from "@/lib/formatters";

export async function GET() {
  try {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const holidays = await prisma.holiday.findMany({
      where: {
        holidayDate: { gte: startOfToday },
      },
      orderBy: { holidayDate: "asc" },
      take: 5,
    });

    return jsonResponse(holidays.map(formatHoliday));
  } catch (error: any) {
    console.error("GET /api/holidays/upcoming error:", error);
    return errorResponse(error.message || "Failed to fetch upcoming holidays", 500);
  }
}
