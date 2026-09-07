import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLocation, parseTimeToDate } from "@/lib/formatters";

export async function GET() {
  try {
    let loc = await prisma.companyLocation.findFirst({
      orderBy: { id: "asc" },
    });

    if (!loc) {
      loc = await prisma.companyLocation.create({
        data: {
          companyName: "ABC Technologies - Main Office",
          latitude: 11.078319,
          longitude: 76.999745,
          allowedRadius: 50.0,
          maxGpsAccuracy: 100.0,
          officeLoginTime: parseTimeToDate("09:00:00"),
          officeLogoutTime: parseTimeToDate("18:00:00"),
          gracePeriodMinutes: 15,
          itLoginTime: parseTimeToDate("09:00:00"),
          itLogoutTime: parseTimeToDate("18:30:00"),
          itGraceMinutes: 15,
          edtechLoginTime: parseTimeToDate("08:45:00"),
          edtechLogoutTime: parseTimeToDate("17:45:00"),
          edtechGraceMinutes: 15,
          businessLoginTime: parseTimeToDate("08:45:00"),
          businessLogoutTime: parseTimeToDate("17:45:00"),
          businessGraceMinutes: 15,
          ogLoginTime: parseTimeToDate("08:45:00"),
          ogLogoutTime: parseTimeToDate("18:15:00"),
          ogGraceMinutes: 15,
        },
      });
    }

    return jsonResponse(formatLocation(loc));
  } catch (error: any) {
    console.error("GET /api/location error:", error);
    return errorResponse(error.message || "Failed to fetch company location", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    let loc = await prisma.companyLocation.findFirst({
      orderBy: { id: "asc" },
    });

    const updateData: any = {};
    if (body.companyName !== undefined) updateData.companyName = body.companyName.trim();
    if (body.latitude !== undefined) updateData.latitude = Number(body.latitude);
    if (body.longitude !== undefined) updateData.longitude = Number(body.longitude);
    if (body.allowedRadius !== undefined) updateData.allowedRadius = Number(body.allowedRadius);
    if (body.maxGpsAccuracy !== undefined) updateData.maxGpsAccuracy = Number(body.maxGpsAccuracy);
    if (body.officeLoginTime !== undefined) updateData.officeLoginTime = parseTimeToDate(body.officeLoginTime);
    if (body.officeLogoutTime !== undefined) updateData.officeLogoutTime = parseTimeToDate(body.officeLogoutTime);
    if (body.gracePeriodMinutes !== undefined) updateData.gracePeriodMinutes = Number(body.gracePeriodMinutes);

    if (body.itLoginTime !== undefined) updateData.itLoginTime = parseTimeToDate(body.itLoginTime);
    if (body.itLogoutTime !== undefined) updateData.itLogoutTime = parseTimeToDate(body.itLogoutTime);
    if (body.itGraceMinutes !== undefined) updateData.itGraceMinutes = Number(body.itGraceMinutes);

    if (body.edtechLoginTime !== undefined) updateData.edtechLoginTime = parseTimeToDate(body.edtechLoginTime);
    if (body.edtechLogoutTime !== undefined) updateData.edtechLogoutTime = parseTimeToDate(body.edtechLogoutTime);
    if (body.edtechGraceMinutes !== undefined) updateData.edtechGraceMinutes = Number(body.edtechGraceMinutes);

    if (body.businessLoginTime !== undefined) updateData.businessLoginTime = parseTimeToDate(body.businessLoginTime);
    if (body.businessLogoutTime !== undefined) updateData.businessLogoutTime = parseTimeToDate(body.businessLogoutTime);
    if (body.businessGraceMinutes !== undefined) updateData.businessGraceMinutes = Number(body.businessGraceMinutes);

    if (body.ogLoginTime !== undefined) updateData.ogLoginTime = parseTimeToDate(body.ogLoginTime);
    if (body.ogLogoutTime !== undefined) updateData.ogLogoutTime = parseTimeToDate(body.ogLogoutTime);
    if (body.ogGraceMinutes !== undefined) updateData.ogGraceMinutes = Number(body.ogGraceMinutes);

    if (loc) {
      loc = await prisma.companyLocation.update({
        where: { id: loc.id },
        data: updateData,
      });
    } else {
      loc = await prisma.companyLocation.create({
        data: {
          companyName: updateData.companyName || "Main Office",
          latitude: updateData.latitude || 11.078319,
          longitude: updateData.longitude || 76.999745,
          allowedRadius: updateData.allowedRadius || 50.0,
          maxGpsAccuracy: updateData.maxGpsAccuracy || 100.0,
          officeLoginTime: updateData.officeLoginTime || parseTimeToDate("09:00:00"),
          officeLogoutTime: updateData.officeLogoutTime || parseTimeToDate("18:00:00"),
          gracePeriodMinutes: updateData.gracePeriodMinutes ?? 15,
          itLoginTime: updateData.itLoginTime || parseTimeToDate("09:00:00"),
          itLogoutTime: updateData.itLogoutTime || parseTimeToDate("18:30:00"),
          itGraceMinutes: updateData.itGraceMinutes ?? 15,
          edtechLoginTime: updateData.edtechLoginTime || parseTimeToDate("08:45:00"),
          edtechLogoutTime: updateData.edtechLogoutTime || parseTimeToDate("17:45:00"),
          edtechGraceMinutes: updateData.edtechGraceMinutes ?? 15,
          businessLoginTime: updateData.businessLoginTime || parseTimeToDate("08:45:00"),
          businessLogoutTime: updateData.businessLogoutTime || parseTimeToDate("17:45:00"),
          businessGraceMinutes: updateData.businessGraceMinutes ?? 15,
          ogLoginTime: updateData.ogLoginTime || parseTimeToDate("08:45:00"),
          ogLogoutTime: updateData.ogLogoutTime || parseTimeToDate("18:15:00"),
          ogGraceMinutes: updateData.ogGraceMinutes ?? 15,
          ...updateData,
        },
      });
    }

    return jsonResponse(formatLocation(loc));
  } catch (error: any) {
    console.error("PUT /api/location error:", error);
    return errorResponse(error.message || "Failed to update company location", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const companyName = body.companyName?.trim();
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);

    if (!companyName || isNaN(lat) || isNaN(lng)) {
      return errorResponse("Company name, latitude, and longitude are required", 400);
    }

    const loc = await prisma.companyLocation.create({
      data: {
        companyName,
        latitude: lat,
        longitude: lng,
        allowedRadius: Number(body.allowedRadius || 50.0),
        maxGpsAccuracy: Number(body.maxGpsAccuracy || 100.0),
        officeLoginTime: parseTimeToDate(body.officeLoginTime, "09:00:00"),
        officeLogoutTime: parseTimeToDate(body.officeLogoutTime, "18:00:00"),
        gracePeriodMinutes: Number(body.gracePeriodMinutes || 15),
        itLoginTime: parseTimeToDate(body.itLoginTime, "09:00:00"),
        itLogoutTime: parseTimeToDate(body.itLogoutTime, "18:30:00"),
        itGraceMinutes: Number(body.itGraceMinutes || 15),
        edtechLoginTime: parseTimeToDate(body.edtechLoginTime, "08:45:00"),
        edtechLogoutTime: parseTimeToDate(body.edtechLogoutTime, "17:45:00"),
        edtechGraceMinutes: Number(body.edtechGraceMinutes || 15),
        businessLoginTime: parseTimeToDate(body.businessLoginTime, "08:45:00"),
        businessLogoutTime: parseTimeToDate(body.businessLogoutTime, "17:45:00"),
        businessGraceMinutes: Number(body.businessGraceMinutes || 15),
        ogLoginTime: parseTimeToDate(body.ogLoginTime, "08:45:00"),
        ogLogoutTime: parseTimeToDate(body.ogLogoutTime, "18:15:00"),
        ogGraceMinutes: Number(body.ogGraceMinutes || 15),
      },
    });

    return jsonResponse(formatLocation(loc), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/location error:", error);
    return errorResponse(error.message || "Failed to create location", 500);
  }
}
