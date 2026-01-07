import { NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrate";

export async function POST() {
  try {
    await runMigrations();
    return NextResponse.json({ success: true, message: "Migrations completed" });
  } catch (error: unknown) {
        console.error("Migration failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

