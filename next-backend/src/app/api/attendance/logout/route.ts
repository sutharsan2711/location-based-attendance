import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateDistance } from "@/lib/geo";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    if (authUser.status === "INACTIVE") {
      return errorResponse("Your employee account is inactive.", 403);
    }

    const body = await req.json();
    const lat = Number(body.latitude);
    const lng = Number(body.longitude);
    const accuracy = Number(body.accuracy || 15);

    if (isNaN(lat) || isNaN(lng)) {
      return errorResponse("Valid GPS latitude and longitude are required", 400);
    }

    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        attendanceDate: todayDate,
      },
    });

    if (!attendance) {
      return errorResponse("You must login before logout.", 400);
    }

    if (attendance.status === "COMPLETED") {
      return errorResponse("You have already logged out today.", 400);
    }

    const locations = await prisma.companyLocation.findMany();
    if (locations.length === 0) {
      return errorResponse("Company location settings not configured.", 400);
    }

    let matchedLocation: typeof locations[0] | null = null;
    let minDistance = Infinity;
    let nearestLocation = locations[0];

    for (const loc of locations) {
      const dist = calculateDistance(lat, lng, loc.latitude, loc.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestLocation = loc;
      }
      if (dist <= loc.allowedRadius) {
        matchedLocation = loc;
        minDistance = dist;
        break;
      }
    }

    const location = matchedLocation || nearestLocation;

    if (accuracy > location.maxGpsAccuracy) {
      return errorResponse(
        `Location accuracy is too low (${accuracy.toFixed(1)} meters). Please enable precise location and try again.`,
        400,
        { accuracy, maxAllowed: location.maxGpsAccuracy }
      );
    }

    if (!matchedLocation) {
      return errorResponse(
        `You are outside the allowed office location (${minDistance.toFixed(1)}m from ${nearestLocation.companyName}). Allowed radius: ${nearestLocation.allowedRadius}m`,
        400,
        { distance: minDistance, allowedRadius: nearestLocation.allowedRadius }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        logoutTime: now,
        logoutLatitude: lat,
        logoutLongitude: lng,
        logoutAccuracy: accuracy,
        logoutDistance: minDistance,
        status: "COMPLETED",
      },
    });

    return jsonResponse({
      success: true,
      message: "Sign Out recorded successfully! Attendance complete for today.",
      distance: minDistance,
      allowedRadius: location.allowedRadius,
      timestamp: now.toISOString(),
      status: "COMPLETED",
      timingStatus: updated.timingStatus,
      attendance: updated,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/logout error:", error);
    return errorResponse(error.message || "Failed to record sign-out", 500);
  }
}
