import { NextRequest } from "next/server";
import { GET as getMyPermissions } from "@/app/api/permissions/my/route";

export async function GET(req: NextRequest) {
  return getMyPermissions(req);
}
