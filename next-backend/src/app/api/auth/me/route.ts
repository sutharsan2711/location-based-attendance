import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }

  return jsonResponse({
    id: user.id,
    name: user.name,
    email: user.email,
    employeeCode: user.employeeCode,
    department: user.department,
    role: user.role,
    status: user.status,
    profileData: user.profileData,
  });
}
