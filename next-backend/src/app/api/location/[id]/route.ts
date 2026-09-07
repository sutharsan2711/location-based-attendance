import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatLocation, parseTimeToDate } from "@/lib/formatters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const locId = BigInt(id);

    const loc = await prisma.companyLocation.findUnique({
      where: { id: locId },
    });

    if (!loc) {
      return errorResponse(`Location not found with id: ${id}`, 404);
    }

    return jsonResponse(formatLocation(loc));
  } catch (error: any) {
    console.error("GET /api/location/[id] error:", error);
    return errorResponse(error.message || "Failed to fetch location", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const locId = BigInt(id);
    const body = await req.json();

    const existing = await prisma.companyLocation.findUnique({ where: { id: locId } });
    if (!existing) {
      return errorResponse(`Location not found with id: ${id}`, 404);
    }

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

    const updated = await prisma.companyLocation.update({
      where: { id: locId },
      data: updateData,
    });

    return jsonResponse(formatLocation(updated));
  } catch (error: any) {
    console.error("PUT /api/location/[id] error:", error);
    return errorResponse(error.message || "Failed to update location", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const locId = BigInt(id);

    const count = await prisma.companyLocation.count();
    if (count <= 1) {
      return errorResponse("Cannot delete the only company location. At least one location must exist.", 400);
    }

    await prisma.companyLocation.delete({
      where: { id: locId },
    });

    return jsonResponse({ success: true, message: "Location deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/location/[id] error:", error);
    return errorResponse(error.message || "Failed to delete location", 500);
  }
}
