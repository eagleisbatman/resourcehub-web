import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

export async function GET(_req: NextRequest) {
  return handler(_req);
}

export async function POST(_req: NextRequest) {
  return handler(_req);
}

