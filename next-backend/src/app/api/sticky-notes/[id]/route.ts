import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatStickyNote } from "@/lib/formatters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const noteId = BigInt(id);

    const note = await prisma.stickyNote.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return errorResponse(`Sticky note not found with id: ${id}`, 404);
    }

    return jsonResponse(formatStickyNote(note));
  } catch (error: any) {
    console.error("GET /api/sticky-notes/[id] error:", error);
    return errorResponse(error.message || "Failed to fetch sticky note", 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const noteId = BigInt(id);
    const body = await req.json();

    const existing = await prisma.stickyNote.findUnique({ where: { id: noteId } });
    if (!existing) {
      return errorResponse(`Sticky note not found with id: ${id}`, 404);
    }

    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.content !== undefined) updateData.content = body.content?.trim() || null;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.isPinned !== undefined || body.pinned !== undefined) {
      updateData.isPinned = body.isPinned ?? body.pinned;
    }
    if (body.checklistJson !== undefined || body.checklistData !== undefined) {
      updateData.checklistJson = body.checklistJson || body.checklistData || null;
    }

    const updated = await prisma.stickyNote.update({
      where: { id: noteId },
      data: updateData,
    });

    return jsonResponse(formatStickyNote(updated));
  } catch (error: any) {
    console.error("PUT /api/sticky-notes/[id] error:", error);
    return errorResponse(error.message || "Failed to update sticky note", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const noteId = BigInt(id);

    await prisma.stickyNote.delete({
      where: { id: noteId },
    });

    return jsonResponse({ success: true, message: `Sticky note ${id} deleted successfully` });
  } catch (error: any) {
    console.error("DELETE /api/sticky-notes/[id] error:", error);
    return errorResponse(error.message || "Failed to delete sticky note", 500);
  }
}
