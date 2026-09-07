import { GET as getAllLocs } from "@/app/api/location/all/route";

export async function GET() {
  return getAllLocs();
}
