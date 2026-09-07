import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { calculateDistance, parseTimeString, isTimeAfter } from "@/lib/geo";
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
    // Midnight date for today
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if already logged in today
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        attendanceDate: todayDate,
      },
    });

    if (existing && (existing.status === "LOGGED_IN" || existing.status === "COMPLETED")) {
      return errorResponse("You have already logged in today.", 400);
    }

    // Get all company locations
    const locations = await prisma.companyLocation.findMany();
    if (locations.length === 0) {
      return errorResponse("Company location settings not configured.", 400);
    }

    // Find nearest location and check if inside ANY location boundary
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

    // Determine shift timings based on employee's department
    let dept = authUser.department?.toUpperCase() || "IT";
    if (authUser.profileData) {
      const profileLower = authUser.profileData.toLowerCase();
      if (profileLower.includes("edtech")) dept = "EDTECH";
      else if (profileLower.includes("business")) dept = "BUSINESS_SOLUTION";
      else if (profileLower.includes("og")) dept = "OG";
      else if (profileLower.includes("it")) dept = "IT";
    }

    let shiftTimeStr = location.officeLoginTime || "09:00:00";
    let graceMinutes = location.gracePeriodMinutes || 15;

    if (dept === "EDTECH") {
      shiftTimeStr = location.edtechLoginTime || "08:45:00";
      graceMinutes = location.edtechGraceMinutes || 15;
    } else if (dept.includes("BUSINESS")) {
      shiftTimeStr = location.businessLoginTime || "08:45:00";
      graceMinutes = location.businessGraceMinutes || 15;
    } else if (dept.includes("OG")) {
      shiftTimeStr = location.ogLoginTime || "08:45:00";
      graceMinutes = location.ogGraceMinutes || 15;
    } else {
      shiftTimeStr = location.itLoginTime || "09:00:00";
      graceMinutes = location.itGraceMinutes || 15;
    }

    const { hours: shiftH, minutes: shiftM } = parseTimeString(shiftTimeStr);
    const thresholdMinutes = shiftM + graceMinutes;
    const threshH = shiftH + Math.floor(thresholdMinutes / 60);
    const threshM = thresholdMinutes % 60;

    // Check approved permission for today covering login
    const approvedPermissions = await prisma.permissionRequest.findMany({
      where: {
        employeeId: BigInt(authUser.id),
        permissionDate: todayDate,
        status: "APPROVED",
      },
    });

    const isLate = isTimeAfter(now, threshH, threshM);
    let timingStatus: "PRESENT" | "LATE" | "PERMISSION" = "PRESENT";

    if (approvedPermissions.length > 0) {
      timingStatus = "PERMISSION";
    } else if (isLate) {
      timingStatus = "LATE";
    }

    // Save attendance
    let attendanceRecord;
    if (existing) {
      attendanceRecord = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          loginTime: now,
          loginLatitude: lat,
          loginLongitude: lng,
          loginAccuracy: accuracy,
          loginDistance: minDistance,
          status: "LOGGED_IN",
          timingStatus,
        },
      });
    } else {
      attendanceRecord = await prisma.attendance.create({
        data: {
          employeeId: BigInt(authUser.id),
          attendanceDate: todayDate,
          loginTime: now,
          loginLatitude: lat,
          loginLongitude: lng,
          loginAccuracy: accuracy,
          loginDistance: minDistance,
          status: "LOGGED_IN",
          timingStatus,
        },
      });
    }

    const message =
      timingStatus === "LATE"
        ? "Login recorded (LATE)"
        : timingStatus === "PERMISSION"
        ? "Login recorded (PERMISSION)"
        : "Login recorded successfully (ON TIME)";

    return jsonResponse({
      success: true,
      message,
      distance: minDistance,
      allowedRadius: location.allowedRadius,
      timestamp: now.toISOString(),
      status: "LOGGED_IN",
      timingStatus,
      attendance: attendanceRecord,
    });
  } catch (error: any) {
    console.error("POST /api/attendance/login error:", error);
    return errorResponse(error.message || "Failed to record sign-in", 500);
  }
}
