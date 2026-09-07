import { NextRequest } from "next/server";
import { GET as getLoc, PUT as putLoc, POST as postLoc } from "@/app/api/location/route";

export async function GET() {
  return getLoc();
}

export async function PUT(req: NextRequest) {
  return putLoc(req);
}

export async function POST(req: NextRequest) {
  return postLoc(req);
}
