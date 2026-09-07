import { NextRequest } from "next/server";
import { GET as getMyLeaves } from "@/app/api/leaves/my/route";

export async function GET(req: NextRequest) {
  return getMyLeaves(req);
}
