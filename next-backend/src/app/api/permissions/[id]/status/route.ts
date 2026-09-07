import { NextRequest } from "next/server";
import { PATCH as updatePermissionStatus } from "@/app/api/admin/permissions/[id]/status/route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return updatePermissionStatus(req, { params });
}
