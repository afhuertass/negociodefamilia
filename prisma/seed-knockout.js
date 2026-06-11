/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, Round } = require('@prisma/client');
const prisma = new PrismaClient();

const matches = [
  // Round of 32
  [73, Round.ROUND_OF_32, '2026-06-28T18:00:00-07:00', 'Inglewood', 'Winner Group I', '3rd Group C/D/F/G/H'],
  [74, Round.ROUND_OF_32, '2026-06-29T14:00:00-05:00', 'Houston', 'Winner Group C', 'Runner-up Group F'],
  [75, Round.ROUND_OF_32, '2026-06-29T20:00:00-06:00', 'Guadalupe', 'Runner-up Group A', 'Runner-up Group B'],
  [76, Round.ROUND_OF_32, '2026-06-30T16:00:00-04:00', 'East Rutherford', 'Winner Group E', '3rd Group A/B/C/D/F'],
  [77, Round.ROUND_OF_32, '2026-06-30T20:00:00-05:00', 'Arlington', 'Runner-up Group E', 'Runner-up Group I'],
  [78, Round.ROUND_OF_32, '2026-06-30T20:00:00-06:00', 'Mexico City', 'Winner Group A', '3rd Group C/E/F/H/I'],
  [79, Round.ROUND_OF_32, '2026-07-01T15:00:00-07:00', 'Santa Clara', 'Winner Group H', 'Runner-up Group J'],
  [80, Round.ROUND_OF_32, '2026-07-01T18:00:00-04:00', 'Atlanta', 'Winner Group L', '3rd Group E/H/I/J/K'],
  [81, Round.ROUND_OF_32, '2026-07-01T18:00:00-07:00', 'Seattle', 'Winner Group D', '3rd Group B/E/F/I/J'],
  [82, Round.ROUND_OF_32, '2026-07-02T15:00:00-07:00', 'Vancouver', 'Runner-up Group D', 'Runner-up Group G'],
  [83, Round.ROUND_OF_32, '2026-07-02T20:00:00-04:00', 'Toronto', 'Runner-up Group K', 'Runner-up Group L'],
  [84, Round.ROUND_OF_32, '2026-07-02T20:00:00-07:00', 'Inglewood', 'Winner Group F', 'Runner-up Group C'],
  [85, Round.ROUND_OF_32, '2026-07-03T15:00:00-05:00', 'Kansas City', 'Winner Group K', '3rd Group D/E/I/J/L'],
  [86, Round.ROUND_OF_32, '2026-07-03T18:00:00-04:00', 'Miami Gardens', 'Winner Group J', 'Runner-up Group H'],
  [87, Round.ROUND_OF_32, '2026-07-03T20:00:00-05:00', 'Arlington', 'Winner Group B', '3rd Group E/F/G/I/J'],
  [88, Round.ROUND_OF_32, '2026-07-04T15:00:00-04:00', 'Philadelphia', 'Winner Group G', '3rd Group A/E/H/I/J'],

  // Round of 16
  [89, Round.ROUND_OF_16, '2026-07-04T18:00:00-05:00', 'Houston', 'Winner Match 74', 'Winner Match 73'],
  [90, Round.ROUND_OF_16, '2026-07-05T15:00:00-04:00', 'East Rutherford', 'Winner Match 76', 'Winner Match 77'],
  [91, Round.ROUND_OF_16, '2026-07-05T18:00:00-06:00', 'Mexico City', 'Winner Match 78', 'Winner Match 79'],
  [92, Round.ROUND_OF_16, '2026-07-06T15:00:00-05:00', 'Arlington', 'Winner Match 83', 'Winner Match 84'],
  [93, Round.ROUND_OF_16, '2026-07-06T18:00:00-07:00', 'Seattle', 'Winner Match 81', 'Winner Match 82'],
  [94, Round.ROUND_OF_16, '2026-07-07T15:00:00-04:00', 'Atlanta', 'Winner Match 86', 'Winner Match 88'],
  [95, Round.ROUND_OF_16, '2026-07-07T18:00:00-07:00', 'Vancouver', 'Winner Match 85', 'Winner Match 87'],
  [96, Round.ROUND_OF_16, '2026-07-09T18:00:00-04:00', 'Foxborough', 'Winner Match 89', 'Winner Match 90'],

  // Quarter-finals
  [97, Round.QUARTER_FINALS, '2026-07-09T18:00:00-04:00', 'Foxborough', 'Winner Match 89', 'Winner Match 90'],
  [98, Round.QUARTER_FINALS, '2026-07-10T18:00:00-07:00', 'Inglewood', 'Winner Match 93', 'Winner Match 94'],
  [99, Round.QUARTER_FINALS, '2026-07-11T15:00:00-04:00', 'Miami Gardens', 'Winner Match 91', 'Winner Match 92'],
  [100, Round.QUARTER_FINALS, '2026-07-11T18:00:00-05:00', 'Kansas City', 'Winner Match 95', 'Winner Match 96'],

  // Semi-finals and final
  [101, Round.SEMI_FINALS, '2026-07-14T19:00:00-05:00', 'Arlington', 'Winner Match 97', 'Winner Match 98'],
  [102, Round.SEMI_FINALS, '2026-07-15T20:00:00-04:00', 'Atlanta', 'Winner Match 99', 'Winner Match 100'],
  [104, Round.FINAL, '2026-07-19T18:00:00-04:00', 'East Rutherford', 'Winner Match 101', 'Winner Match 102'],
];

async function main() {
  for (const [matchNumber, round, startsAt, stadium, homeSlot, awaySlot] of matches) {
    await prisma.match.upsert({
      where: { matchNumber },
      update: { round, startsAt: new Date(startsAt), stadium, homeSlot, awaySlot },
      create: { matchNumber, round, startsAt: new Date(startsAt), stadium, homeSlot, awaySlot },
    });
  }
  console.log(`Seeded ${matches.length} knockout bracket matches/placeholders.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => prisma.$disconnect());
