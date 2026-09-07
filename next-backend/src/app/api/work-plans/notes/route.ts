import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatWorkNote } from "@/lib/formatters";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(req.url);
    const dateQuery = searchParams.get("date");
    const now = dateQuery ? new Date(dateQuery) : new Date();

    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    const note = await prisma.dailyWorkNote.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        noteDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { id: "desc" },
    });

    return jsonResponse(note ? formatWorkNote(note) : null);
  } catch (error: any) {
    console.error("GET /api/work-plans/notes error:", error);
    return errorResponse(error.message || "Failed to fetch notes", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const notes = body.notes !== undefined ? String(body.notes).trim() : "";
    const kpiScore = body.kpiScore !== undefined ? Number(body.kpiScore) : null;

    const now = body.noteDate ? new Date(body.noteDate) : new Date();
    const noteDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const startOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

    const existing = await prisma.dailyWorkNote.findFirst({
      where: {
        employeeId: BigInt(authUser.id),
        noteDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    let savedNote;
    if (existing) {
      savedNote = await prisma.dailyWorkNote.update({
        where: { id: existing.id },
        data: {
          notes,
          kpiScore,
        },
      });
    } else {
      savedNote = await prisma.dailyWorkNote.create({
        data: {
          employeeId: BigInt(authUser.id),
          noteDate,
          notes,
          kpiScore,
        },
      });
    }

    return jsonResponse(formatWorkNote(savedNote));
  } catch (error: any) {
    console.error("POST /api/work-plans/notes error:", error);
    return errorResponse(error.message || "Failed to save daily notes", 500);
  }
}
