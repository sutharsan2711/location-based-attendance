import { NextRequest } from "next/server";
import { PATCH as updateStatus } from "@/app/api/admin/leaves/[id]/status/route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return updateStatus(req, { params });
}
