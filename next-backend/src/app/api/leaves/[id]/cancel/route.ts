import { NextRequest } from "next/server";
import { PATCH as withdrawHandler } from "@/app/api/leaves/[id]/withdraw/route";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return withdrawHandler(req, { params });
}
