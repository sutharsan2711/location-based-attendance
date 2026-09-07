import { jsonResponse } from "@/lib/serializers";

export async function POST() {
  return jsonResponse({
    success: true,
    message: "Logged out successfully",
  });
}
