import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAnnouncement } from "@/lib/formatters";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const item = await prisma.announcement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!item) {
      return errorResponse("Announcement not found", 404);
    }

    return jsonResponse(formatAnnouncement(item));
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch announcement", 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.announcement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      return errorResponse("Announcement not found", 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content.trim();
    if (body.category !== undefined) updateData.category = body.category;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.targetDepartment !== undefined) updateData.targetDepartment = body.targetDepartment ? body.targetDepartment.trim() : null;
    if (body.targetRole !== undefined) updateData.targetRole = body.targetRole ? body.targetRole.trim() : null;
    if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned);
    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const updated = await prisma.announcement.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return jsonResponse(formatAnnouncement(updated));
  } catch (error: any) {
    console.error("PUT /api/announcements/[id] error:", error);
    return errorResponse(error.message || "Failed to update announcement", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    await prisma.announcement.delete({
      where: { id: BigInt(id) },
    });

    return jsonResponse({ message: "Announcement deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/announcements/[id] error:", error);
    return errorResponse(error.message || "Failed to delete announcement", 500);
  }
}
