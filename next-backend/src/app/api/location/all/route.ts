import { prisma } from "@/lib/prisma";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLocation } from "@/lib/formatters";

export async function GET() {
  try {
    let list = await prisma.companyLocation.findMany({
      orderBy: { id: "asc" },
    });

    if (list.length === 0) {
      const defaultLoc = await prisma.companyLocation.create({
        data: {
          companyName: "ABC Technologies - Main Office",
          latitude: 11.078319,
          longitude: 76.999745,
          allowedRadius: 50.0,
          maxGpsAccuracy: 100.0,
          officeLoginTime: "09:00:00",
          officeLogoutTime: "18:00:00",
          gracePeriodMinutes: 15,
          itLoginTime: "09:00:00",
          itLogoutTime: "18:30:00",
          itGraceMinutes: 15,
          edtechLoginTime: "08:45:00",
          edtechLogoutTime: "17:45:00",
          edtechGraceMinutes: 15,
          businessLoginTime: "08:45:00",
          businessLogoutTime: "17:45:00",
          businessGraceMinutes: 15,
          ogLoginTime: "08:45:00",
          ogLogoutTime: "18:15:00",
          ogGraceMinutes: 15,
        },
      });
      list = [defaultLoc];
    }

    return jsonResponse(list.map(formatLocation));
  } catch (error: any) {
    console.error("GET /api/location/all error:", error);
    return errorResponse(error.message || "Failed to fetch all locations", 500);
  }
}
