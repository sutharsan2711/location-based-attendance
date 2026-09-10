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

    const body = await req.json().catch(() => ({}));
    let lat = Number(body.latitude);
    let lng = Number(body.longitude);
    const accuracy = Number(body.accuracy || 15);

    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        attendanceDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { id: "desc" },
    });

    if (!attendance) {
      return errorResponse("You must login before logout.", 400);
    }

    if (attendance.status === "COMPLETED") {
      return errorResponse("You have already logged out today.", 400);
    }

    const locations = await prisma.companyLocation.findMany();
    let minDistance = 0;
    let nearestLocation = locations[0];
    let matchedLocation: typeof locations[0] | null = null;

    if (!isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0) && locations.length > 0) {
      minDistance = Infinity;
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
    } else if (locations.length > 0) {
      lat = nearestLocation.latitude;
      lng = nearestLocation.longitude;
      minDistance = 0;
      matchedLocation = nearestLocation;
    }

    const activeLocation = matchedLocation || nearestLocation;

    // Check approved Work From Home (WFH) request for today
    const approvedWfh = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        leaveType: "WORK_FROM_HOME",
        status: "APPROVED",
        fromDate: { lte: endOfDay },
        toDate: { gte: startOfDay },
      },
    });
    const isWfh = Boolean(approvedWfh) || attendance.status === "WORK_FROM_HOME";

    // Enforce geofence boundary if not Work From Home
    if (!isWfh && activeLocation) {
      if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
        return errorResponse("Location coordinates are required to check out. Please turn on device GPS and allow location access in your browser.", 400);
      }

      if (!matchedLocation) {
        const distFormatted = minDistance < 1000 ? `${minDistance.toFixed(1)}m` : `${(minDistance / 1000).toFixed(2)}km`;
        return errorResponse(
          `Out of range! You are ${distFormatted} away from ${nearestLocation.companyName} (Allowed Radius: ${nearestLocation.allowedRadius}m). Please move closer to the office to check out.`,
          400
        );
      }
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
      allowedRadius: nearestLocation?.allowedRadius || 500,
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
