import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import bcrypt from "bcryptjs";

const DUMMY_EMP_CODES = new Set(["EMP001", "EMP002", "EMP003", "EMP004", "EMP005"]);
const DUMMY_NAMES = new Set(["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown"]);

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    const filtered = allUsers.filter((u: any) => {
      if (u.employeeCode && DUMMY_EMP_CODES.has(u.employeeCode.trim().toUpperCase())) return false;
      if (u.name && DUMMY_NAMES.has(u.name.trim())) return false;
      return true;
    });

    return jsonResponse(filtered);
  } catch (error: any) {
    console.error("GET /api/employees error:", error);
    return errorResponse(error.message || "Failed to fetch employees", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const email = body.email?.trim();
    const employeeCode = body.employeeCode?.trim();
    const password = body.password?.trim();

    if (!email || !employeeCode) {
      return errorResponse("Email and Employee Code are required", 400);
    }

    if (!password) {
      return errorResponse("Password is required for new employees", 400);
    }

    // Check uniqueness
    const existingEmail = await prisma.user.findFirst({ where: { email } });
    if (existingEmail) {
      return errorResponse(`Email already exists: ${email}`, 400);
    }

    const existingCode = await prisma.user.findFirst({ where: { employeeCode } });
    if (existingCode) {
      return errorResponse(`Employee Code already exists: ${employeeCode}`, 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name: body.name?.trim() || "Employee",
        email,
        employeeCode,
        password: hashedPassword,
        phone: body.phone?.trim() || null,
        role: body.role || "EMPLOYEE",
        employment_type: body.employment_type || body.staffType || null,
        status: body.status || "ACTIVE",
        department: body.department?.trim() || "IT",
        profileData: body.profileData ? (typeof body.profileData === "string" ? body.profileData : JSON.stringify(body.profileData)) : null,
      },
    });

    // Automatically initialize default leave balance for current year
    const currentYear = new Date().getFullYear();
    await prisma.leaveBalance.create({
      data: {
        employeeId: newUser.id,
        year: currentYear,
        casualLeaveGranted: 5.0,
        casualLeaveCarriedForward: 0.0,
        sickLeaveGranted: 1.0,
        sickLeaveCarriedForward: 0.0,
        compOffGranted: 0.0,
        compOffCarriedForward: 0.0,
        lossOfPayGranted: 0.0,
        workFromHomeGranted: 0.0,
      },
    });

    return jsonResponse(newUser, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/employees error:", error);
    return errorResponse(error.message || "Failed to create employee", 500);
  }
}
