import { NextRequest } from "next/server";
import { verifyJwt, TokenPayload } from "./jwt";
import { prisma } from "./prisma";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  employeeCode: string;
  role: string;
  department: string | null;
  status: string;
  profileData: string | null;
}

export async function getAuthUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const payload = await verifyJwt(token);
  if (!payload) return null;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { id: BigInt(payload.userId) },
        { email: payload.sub },
        { employeeCode: payload.sub },
      ],
    },
  });

  if (!user) return null;

  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    employeeCode: user.employeeCode,
    role: user.role,
    department: user.department,
    status: user.status,
    profileData: user.profileData,
  };
}

export function isUserAdmin(user: AuthenticatedUser | null): boolean {
  return !!user && user.role.toUpperCase() === "ADMIN";
}
