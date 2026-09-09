import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAnnouncement } from "@/lib/formatters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const whereClause: any = {};
    if (category && category !== "ALL") {
      whereClause.category = category;
    }
    if (activeOnly) {
      whereClause.isActive = true;
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return jsonResponse(announcements.map(formatAnnouncement));
  } catch (error: any) {
    console.error("GET /api/announcements error:", error);
    return errorResponse(error.message || "Failed to fetch announcements", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const title = body.title?.trim();
    const content = body.content?.trim();

    if (!title || !content) {
      return errorResponse("Title and content are required", 400);
    }

    const category = body.category || "GENERAL";
    const priority = body.priority || "NORMAL";
    const targetDepartment = body.targetDepartment?.trim() || null;
    const targetRole = body.targetRole?.trim() || null;
    const isPinned = Boolean(body.isPinned);
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const authorName = body.authorName || authUser.name || "HR / Management";
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const created = await prisma.announcement.create({
      data: {
        title,
        content,
        category,
        priority,
        targetDepartment,
        targetRole,
        isPinned,
        isActive,
        authorName,
        expiresAt,
      },
    });

    return jsonResponse(formatAnnouncement(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/announcements error:", error);
    return errorResponse(error.message || "Failed to create announcement", 500);
  }
}
