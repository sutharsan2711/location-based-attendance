import { NextRequest } from "next/server";
import { GET as getLocId, PUT as putLocId, DELETE as delLocId } from "@/app/api/location/[id]/route";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  return getLocId(req, { params });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return putLocId(req, { params });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return delLocId(req, { params });
}
