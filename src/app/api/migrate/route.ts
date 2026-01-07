import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrate";

export async function POST() {
  try {
    await runMigrations();
    return NextResponse.json({ success: true, message: "Migrations completed" });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("Migration failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

