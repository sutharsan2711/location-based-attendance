import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatStickyNote } from "@/lib/formatters";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { id } = await params;
    const noteId = BigInt(id);

    const existing = await prisma.stickyNote.findUnique({ where: { id: noteId } });
    if (!existing) {
      return errorResponse(`Sticky note not found with id: ${id}`, 404);
    }

    const updated = await prisma.stickyNote.update({
      where: { id: noteId },
      data: { isPinned: !existing.isPinned },
    });

    return jsonResponse(formatStickyNote(updated));
  } catch (error: any) {
    console.error("PATCH /api/sticky-notes/[id]/pin error:", error);
    return errorResponse(error.message || "Failed to toggle pin on sticky note", 500);
  }
}
