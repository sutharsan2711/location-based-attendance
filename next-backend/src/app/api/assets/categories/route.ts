import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, isUserAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/serializers";
import { formatAssetCategory } from "@/lib/formatters";

export const dynamic = "force-dynamic";

const DEFAULT_CATEGORIES = [
  { name: "LAPTOP", description: "Laptops & Notebooks", icon: "Laptop" },
  { name: "MONITOR", description: "External Display Monitors", icon: "Monitor" },
  { name: "ACCESS_CARD", description: "Office Access Cards / RFID Badges", icon: "Shield" },
  { name: "PERIPHERAL", description: "Mouse, Keyboards, Headsets & Cables", icon: "Headphones" },
  { name: "MOBILE", description: "Company Phones & Sim Cards", icon: "Smartphone" },
  { name: "FURNITURE", description: "Ergonomic Chairs & Desks", icon: "Armchair" },
  { name: "OTHER", description: "Other Equipment & Hardware", icon: "Package" },
];

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return errorResponse("Unauthorized", 401);
    }

    let categories = await prisma.assetCategory.findMany({
      orderBy: { name: "asc" },
    });

    // Seed defaults if table is empty
    if (categories.length === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await prisma.assetCategory.create({
          data: cat,
        });
      }
      categories = await prisma.assetCategory.findMany({
        orderBy: { name: "asc" },
      });
    }

    return jsonResponse(categories.map(formatAssetCategory));
  } catch (error: any) {
    console.error("GET /api/assets/categories error:", error);
    return errorResponse(error.message || "Failed to fetch asset categories", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const body = await req.json();
    const name = body.name?.trim().toUpperCase();

    if (!name) {
      return errorResponse("Category name is required", 400);
    }

    const existing = await prisma.assetCategory.findUnique({
      where: { name },
    });

    if (existing) {
      return errorResponse("Category with this name already exists", 400);
    }

    const created = await prisma.assetCategory.create({
      data: {
        name,
        description: body.description?.trim() || null,
        icon: body.icon || "Package",
      },
    });

    return jsonResponse(formatAssetCategory(created), { status: 201 });
  } catch (error: any) {
    console.error("POST /api/assets/categories error:", error);
    return errorResponse(error.message || "Failed to create category", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser || !isUserAdmin(authUser)) {
      return errorResponse("Forbidden: Admin access required", 403);
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const name = searchParams.get("name");

    if (!id && !name) {
      return errorResponse("Category id or name is required", 400);
    }

    if (id) {
      await prisma.assetCategory.delete({
        where: { id: BigInt(id) },
      });
    } else if (name) {
      await prisma.assetCategory.delete({
        where: { name },
      });
    }

    return jsonResponse({ message: "Asset category deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/assets/categories error:", error);
    return errorResponse(error.message || "Failed to delete category", 500);
  }
}
