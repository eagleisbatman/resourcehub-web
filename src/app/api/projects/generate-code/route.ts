import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { like } from "drizzle-orm";
import { requireAuth } from "@/lib/api-utils";

/**
 * Generates a project code with incremental numbering
 * Format: Abbreviation + 2-digit number (e.g., "PROJ01", "PROJ02")
 */
function extractAbbreviation(name: string): string {
  if (!name || name.trim().length === 0) {
    return "PROJ";
  }

  // Clean and split the name into words
  const words = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "") // Remove special characters
    .split(/\s+/)
    .filter((word) => word.length > 0);

  if (words.length === 0) {
    return "PROJ";
  }

  // If single word, take first 4 characters
  if (words.length === 1) {
    return words[0].substring(0, Math.min(4, words[0].length));
  }

  // If multiple words, take first 2-3 characters of first 2 words
  const codeParts: string[] = [];
  const maxWords = Math.min(2, words.length);
  
  for (let i = 0; i < maxWords; i++) {
    const word = words[i];
    if (word.length >= 2) {
      codeParts.push(word.substring(0, 2));
    } else {
      codeParts.push(word);
    }
  }

  let abbreviation = codeParts.join("");
  
  // Ensure abbreviation is between 2-4 characters
  abbreviation = abbreviation.substring(0, Math.min(4, Math.max(2, abbreviation.length)));

  return abbreviation || "PROJ";
}

export async function POST(req: NextRequest) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Name is required" } },
        { status: 400 }
      );
    }

    // Extract abbreviation from name
    const abbreviation = extractAbbreviation(name);

    // Find all existing codes that start with this abbreviation followed by digits
    // Pattern: ABBREVIATION + 2 digits (e.g., "PROJ01", "PROJ02")
    const pattern = `${abbreviation}%`;
    
    const existingProjects = await db
      .select({ code: projects.code })
      .from(projects)
      .where(like(projects.code, pattern));

    // Extract numbers from existing codes
    const numbers: number[] = [];
    // Escape special regex characters in abbreviation
    const escapedAbbreviation = abbreviation.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    existingProjects.forEach((p) => {
      const match = p.code.match(new RegExp(`^${escapedAbbreviation}(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          numbers.push(num);
        }
      }
    });

    // Find the next available number
    let nextNumber = 1;
    if (numbers.length > 0) {
      const maxNumber = Math.max(...numbers);
      nextNumber = maxNumber + 1;
    }

    // Format as 2-digit number (01, 02, ..., 99)
    const formattedNumber = nextNumber.toString().padStart(2, "0");
    const generatedCode = `${abbreviation}${formattedNumber}`;

    return NextResponse.json({ data: { code: generatedCode } });
  } catch (error) {
    console.error("Generate code error:", error);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Failed to generate code" } },
      { status: 500 }
    );
  }
}
