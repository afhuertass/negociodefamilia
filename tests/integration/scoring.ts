import { PrismaClient } from "@prisma/test-client";
import { scoreRound } from "../../lib/scoring";
import { Round } from "@prisma/client";

// Use the test database file in root
const testDbPath = "./test.db";

// TIER 3: Safety Guardrail
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("neon")) {
  console.error("❌ CRITICAL ERROR: Production database connection detected. Aborting test execution.");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${testDbPath}` } },
});

async function setupScenario() {
  await prisma.score.deleteMany();
  await prisma.matchPrediction.deleteMany();
  await prisma.matchResult.deleteMany();
  await prisma.match.deleteMany();
  await prisma.groupPrediction.deleteMany();
  await prisma.participant.deleteMany({ where: { name: "Test Player" } });

  const teamA = await prisma.team.create({ data: { name: `Team A ${Date.now()}` } });
  const teamB = await prisma.team.create({ data: { name: `Team B ${Date.now()}` } });

  const participant = await prisma.participant.create({
    data: { name: "Test Player", accessCode: "test" },
  });

  const match = await prisma.match.create({
    data: { 
      round: Round.ROUND_OF_16, 
      matchNumber: Math.floor(Math.random() * 10000), 
      finished: true,
      homeTeamId: teamA.id,
      awayTeamId: teamB.id
    },
  });

  return { participant, match, teamA, teamB };
}

async function testDrawScenario() {
  console.log("Running: testDrawScenario...");
  const { participant, match, teamA } = await setupScenario();

  await prisma.matchPrediction.create({
    data: {
      participantId: participant.id,
      matchId: match.id,
      homeGoals: 1,
      awayGoals: 1,
      qualifiedTeamId: teamA.id,
    },
  });

  await prisma.matchResult.create({
    data: {
      matchId: match.id,
      homeGoals: 2,
      awayGoals: 2,
      qualifiedTeamId: teamA.id,
    },
  });

  await scoreRound(prisma, Round.ROUND_OF_16);

  const score = await prisma.score.findUnique({
    where: { participantId_phase: { participantId: participant.id, phase: Round.ROUND_OF_16 } },
  });

  if (score?.points === 1) {
    console.log("✅ PASS: Draw-inexact-qualified scenario (1 point under additive rules)");
  } else {
    console.error(`❌ FAIL: Draw-inexact-qualified (Expected 1 point, Got ${score?.points})`);
  }
}

async function testExactScoreScenario() {
  console.log("Running: testExactScoreScenario...");
  const { participant, match, teamA } = await setupScenario();

  await prisma.matchPrediction.create({
    data: {
      participantId: participant.id,
      matchId: match.id,
      homeGoals: 2,
      awayGoals: 1,
      qualifiedTeamId: teamA.id,
    },
  });

  await prisma.matchResult.create({
    data: {
      matchId: match.id,
      homeGoals: 2,
      awayGoals: 1,
      qualifiedTeamId: teamA.id,
    },
  });

  await scoreRound(prisma, Round.ROUND_OF_16);

  const score = await prisma.score.findUnique({
    where: { participantId_phase: { participantId: participant.id, phase: Round.ROUND_OF_16 } },
  });

  if (score?.points === 3) {
    console.log("✅ PASS: Exact score scenario (3 points)");
  } else {
    console.error(`❌ FAIL: Exact score scenario (Expected 3 points, Got ${score?.points})`);
  }
}

async function testFailedDrawScenario() {
  console.log("Running: testFailedDrawScenario...");
  const { participant, match, teamA } = await setupScenario();

  await prisma.matchPrediction.create({
    data: {
      participantId: participant.id,
      matchId: match.id,
      homeGoals: 1,
      awayGoals: 1,
      qualifiedTeamId: teamA.id,
    },
  });

  await prisma.matchResult.create({
    data: {
      matchId: match.id,
      homeGoals: 2,
      awayGoals: 1,
      qualifiedTeamId: teamA.id,
    },
  });

  await scoreRound(prisma, Round.ROUND_OF_16);

  const score = await prisma.score.findUnique({
    where: { participantId_phase: { participantId: participant.id, phase: Round.ROUND_OF_16 } },
  });

  if (score?.points === 1) {
    console.log("✅ PASS: Failed-draw-but-qualified scenario (1 point under additive rules)");
  } else {
    console.error(`❌ FAIL: Failed-draw-but-qualified (Expected 1 point, Got ${score?.points})`);
  }
}

async function main() {
  try {
    await testDrawScenario();
    await testExactScoreScenario();
    await testFailedDrawScenario();
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
