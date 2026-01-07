import { NextResponse } from "next/server";
import { runStartupMigrations } from "@/lib/db/startup";

// This endpoint can be called to trigger migrations manually if needed
export async function POST() {
  try {
    await runStartupMigrations();
    return NextResponse.json({ success: true, message: "Migrations completed" });
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

