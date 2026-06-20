import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreGroupStage, scoreRound } from "@/lib/scoring";
import { Round } from "@prisma/client";

async function recalculateScores(prismaClient: typeof prisma) {
  await scoreGroupStage(prismaClient);
  for (const round of [Round.ROUND_OF_32, Round.ROUND_OF_16, Round.QUARTER_FINALS, Round.SEMI_FINALS, Round.FINAL]) {
    await scoreRound(prismaClient, round);
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: "Sync is disabled." }, { status: 503 });
  /*
  // Verify Vercel Cron Secret
  const authHeader = req.headers.get("authorization");
  ...
  */
}
