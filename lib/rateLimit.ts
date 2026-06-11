import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("RATE_LIMITED");
  }
}

export async function getClientIp() {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || h.get("x-real-ip") || "unknown";
}

export async function checkRateLimit(key: string, limit: number, windowSeconds: number) {
  const now = new Date();
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.expiresAt <= now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) },
      create: { key, count: 1, expiresAt: new Date(now.getTime() + windowSeconds * 1000) },
    });
    return;
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000));
    throw new RateLimitError(retryAfterSeconds);
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
}

export async function cleanExpiredRateLimits() {
  await prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}
