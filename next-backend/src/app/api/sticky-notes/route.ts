import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatStickyNote } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const notes = await prisma.stickyNote.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return jsonResponse(notes.map(formatStickyNote));
  } catch (error: any) {
    console.error("GET /api/sticky-notes error:", error);
    return errorResponse(error.message || "Failed to fetch sticky notes", 500);
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
    if (!title) {
      return errorResponse("Sticky note title is required", 400);
    }

    const isPinned = body.isPinned ?? body.pinned ?? false;
    const checklistJson = body.checklistJson || body.checklistData || null;

    const note = await prisma.stickyNote.create({
      data: {
        title,
        content: body.content?.trim() || null,
        color: body.color || "yellow",
        category: body.category || "General",
        isPinned,
        checklistJson,
        userId: BigInt(authUser.id),
      },
    });

    return jsonResponse(formatStickyNote(note), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/sticky-notes error:", error);
    return errorResponse(error.message || "Failed to create sticky note", 500);
  }
}
