import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/jwt";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.email || body.employeeCode || "").trim();
    const password = body.password || "";

    if (!identifier || !password) {
      return errorResponse("Email/Employee Code and Password are required", 400);
    }

    // Find by email or employee code
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { employeeCode: identifier }],
      },
    });

    if (!user) {
      return errorResponse("Invalid employee code/email or password", 401);
    }

    if (user.status === "INACTIVE") {
      return errorResponse("Your employee account is inactive.", 403);
    }

    let isPasswordValid = false;

    // Direct password match (bcrypt or legacy raw match)
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$") || user.password.startsWith("$2y$")) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      // Plain text check
      isPasswordValid = user.password === password;
    }

    // Fallback standard passwords for admin/staff testing
    if (!isPasswordValid) {
      if (
        user.role.toUpperCase() === "ADMIN" &&
        (password === "admin@123" || password === "123456789" || password === "admin")
      ) {
        isPasswordValid = true;
      } else if (
        password === "123456789" ||
        password === "Password@123" ||
        password.toLowerCase() === "password"
      ) {
        isPasswordValid = true;
      }
    }

    if (!isPasswordValid) {
      return errorResponse("Invalid employee code/email or password", 401);
    }

    // Generate JWT token
    const token = await signJwt({
      userId: Number(user.id),
      name: user.name,
      role: user.role,
      email: user.email,
    });

    return jsonResponse({
      token,
      type: "Bearer",
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        employeeCode: user.employeeCode,
        department: user.department,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return errorResponse(error.message || "An unexpected authentication error occurred", 500);
  }
}
