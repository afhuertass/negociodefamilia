import { randomUUID } from "crypto";
import { Round } from "@prisma/client";
import { prisma } from "@/lib/db";

type PhaseLockRow = {
  phase: Round;
  isLocked: boolean | number;
};

type PrismaWithPhaseLock = typeof prisma & {
  phaseLock?: {
    findMany: () => Promise<PhaseLockRow[]>;
    findUnique: (args: { where: { phase: Round } }) => Promise<PhaseLockRow | null>;
    upsert: (args: {
      where: { phase: Round };
      update: { isLocked: boolean };
      create: { phase: Round; isLocked: boolean };
    }) => Promise<PhaseLockRow>;
  };
};

const db = prisma as PrismaWithPhaseLock;

export async function getPhaseLocks() {
  if (db.phaseLock) return db.phaseLock.findMany();

  return prisma.$queryRawUnsafe<PhaseLockRow[]>(
    'SELECT phase, isLocked FROM "PhaseLock"',
  );
}

export async function isPhaseLocked(phase: Round) {
  if (db.phaseLock) {
    const lock = await db.phaseLock.findUnique({ where: { phase } });
    return Boolean(lock?.isLocked);
  }

  const rows = await prisma.$queryRawUnsafe<PhaseLockRow[]>(
    'SELECT phase, isLocked FROM "PhaseLock" WHERE phase = ?',
    phase,
  );
  return Boolean(rows[0]?.isLocked);
}

export async function setPhaseLocked(phase: Round, isLocked: boolean) {
  if (db.phaseLock) {
    return db.phaseLock.upsert({
      where: { phase },
      update: { isLocked },
      create: { phase, isLocked },
    });
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  await prisma.$executeRawUnsafe(
    'INSERT INTO "PhaseLock" (id, phase, isLocked, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(phase) DO UPDATE SET isLocked = excluded.isLocked, updatedAt = excluded.updatedAt',
    id,
    phase,
    isLocked ? 1 : 0,
    now,
  );
  return { phase, isLocked };
}

export const phaseLabels: Record<Round, string> = {
  GROUP_STAGE: "Fase de grupos",
  ROUND_OF_32: "Dieciseisavos",
  ROUND_OF_16: "Octavos",
  QUARTER_FINALS: "Cuartos",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
  FINAL: "Final",
};
