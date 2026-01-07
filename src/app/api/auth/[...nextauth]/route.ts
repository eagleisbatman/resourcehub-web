import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

export async function GET(req: NextRequest) {
  return (handler as unknown as { GET: (req: NextRequest) => Promise<Response> }).GET(req);
}

export async function POST(req: NextRequest) {
  return (handler as unknown as { POST: (req: NextRequest) => Promise<Response> }).POST(req);
}

