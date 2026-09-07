import { NextResponse } from "next/server";

/**
 * Deeply transforms BigInt to Number and Decimal to Number/String for clean JSON serialization
 */
export function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "bigint") {
    return Number(data);
  }

  if (data instanceof Date) {
    return data.toISOString();
  }

  // Decimal check
  if (typeof data === "object" && data !== null && typeof data.toNumber === "function") {
    return data.toNumber();
  }

  if (Array.isArray(data)) {
    return data.map((item) => serializeData(item));
  }

  if (typeof data === "object") {
    const res: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      res[key] = serializeData(data[key]);
    }
    return res;
  }

  return data;
}

export function jsonResponse(data: any, init?: ResponseInit): NextResponse {
  const serialized = serializeData(data);
  return NextResponse.json(serialized, {
    ...init,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      ...(init?.headers || {}),
    },
  });
}

export function errorResponse(message: string, status: number = 400, extra: Record<string, any> = {}): NextResponse {
  return jsonResponse(
    {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    },
    { status }
  );
}
