import { prisma } from "@/lib/db";
import { scoreGroupStage, scoreRound } from "@/lib/scoring";
import { Round } from "@prisma/client";

export async function runBackgroundSync() {
  console.log("Background Sync is disabled.");
  return;
  /* 
  try {
    const response = await fetch("https://worldcup26.ir/get/games", { cache: "no-store" });
    ...
  } catch (err) {
    console.error("Background Sync Error:", err);
  }
  */
}
