import { NextRequest, NextResponse } from "next/server";
import { getApiKeyUser } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  try {
    const user = await getApiKeyUser(req);
    
    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid API key" } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Validate API key error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to validate API key" } },
      { status: 500 }
    );
  }
}
