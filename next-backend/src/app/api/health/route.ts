import { jsonResponse } from "@/lib/serializers";

export async function GET() {
  return jsonResponse({
    status: "UP",
    message: "Next.js Attendance API Backend is running smoothly",
    timestamp: new Date().toISOString(),
  });
}
