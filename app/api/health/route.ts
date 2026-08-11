import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;

  return NextResponse.json({
    ok: true,
    db: "reachable",
    latencyMs: Date.now() - start,
    checkedAt: new Date().toISOString(),
  });
}
