/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient, Round } = require('@prisma/client');
const prisma = new PrismaClient();

const groups = {
  A: ['Mexico', 'South Africa', 'South Korea', 'Czech Republic'],
  B: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'],
  C: ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
  D: ['United States', 'Paraguay', 'Australia', 'Turkey'],
  E: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'],
  F: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'],
  G: ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
  H: ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
  I: ['France', 'Senegal', 'Iraq', 'Norway'],
  J: ['Argentina', 'Algeria', 'Austria', 'Jordan'],
  K: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'],
  L: ['England', 'Croatia', 'Ghana', 'Panama'],
};

const fixtures = [
  [1, '2026-06-11T13:00:00-06:00', 'Mexico', 'South Africa', 'Estadio Azteca, Mexico City'],
  [2, '2026-06-11T20:00:00-06:00', 'South Korea', 'Czech Republic', 'Estadio Akron, Zapopan'],
  [25, '2026-06-18T12:00:00-04:00', 'Czech Republic', 'South Africa', 'Mercedes-Benz Stadium, Atlanta'],
  [28, '2026-06-18T19:00:00-06:00', 'Mexico', 'South Korea', 'Estadio Akron, Zapopan'],
  [53, '2026-06-24T19:00:00-06:00', 'Czech Republic', 'Mexico', 'Estadio Azteca, Mexico City'],
  [54, '2026-06-24T19:00:00-06:00', 'South Africa', 'South Korea', 'Estadio BBVA, Guadalupe'],

  [3, '2026-06-12T15:00:00-04:00', 'Canada', 'Bosnia and Herzegovina', 'BMO Field, Toronto'],
  [8, '2026-06-13T12:00:00-07:00', 'Qatar', 'Switzerland', "Levi's Stadium, Santa Clara"],
  [26, '2026-06-18T12:00:00-07:00', 'Switzerland', 'Bosnia and Herzegovina', 'SoFi Stadium, Inglewood'],
  [27, '2026-06-18T15:00:00-07:00', 'Canada', 'Qatar', 'BC Place, Vancouver'],
  [51, '2026-06-24T12:00:00-07:00', 'Switzerland', 'Canada', 'BC Place, Vancouver'],
  [52, '2026-06-24T12:00:00-07:00', 'Bosnia and Herzegovina', 'Qatar', 'Lumen Field, Seattle'],

  [7, '2026-06-13T18:00:00-04:00', 'Brazil', 'Morocco', 'MetLife Stadium, East Rutherford'],
  [5, '2026-06-13T21:00:00-04:00', 'Haiti', 'Scotland', 'Gillette Stadium, Foxborough'],
  [30, '2026-06-19T18:00:00-04:00', 'Scotland', 'Morocco', 'Gillette Stadium, Foxborough'],
  [29, '2026-06-19T20:30:00-04:00', 'Brazil', 'Haiti', 'Lincoln Financial Field, Philadelphia'],
  [49, '2026-06-24T18:00:00-04:00', 'Scotland', 'Brazil', 'Hard Rock Stadium, Miami Gardens'],
  [50, '2026-06-24T18:00:00-04:00', 'Morocco', 'Haiti', 'Mercedes-Benz Stadium, Atlanta'],

  [4, '2026-06-12T18:00:00-07:00', 'United States', 'Paraguay', 'SoFi Stadium, Inglewood'],
  [6, '2026-06-13T21:00:00-07:00', 'Australia', 'Turkey', 'BC Place, Vancouver'],
  [32, '2026-06-19T12:00:00-07:00', 'United States', 'Australia', 'Lumen Field, Seattle'],
  [31, '2026-06-19T20:00:00-07:00', 'Turkey', 'Paraguay', "Levi's Stadium, Santa Clara"],
  [59, '2026-06-25T19:00:00-07:00', 'Turkey', 'United States', 'SoFi Stadium, Inglewood'],
  [60, '2026-06-25T19:00:00-07:00', 'Paraguay', 'Australia', "Levi's Stadium, Santa Clara"],

  [10, '2026-06-14T12:00:00-05:00', 'Germany', 'Curaçao', 'NRG Stadium, Houston'],
  [9, '2026-06-14T19:00:00-04:00', 'Ivory Coast', 'Ecuador', 'Lincoln Financial Field, Philadelphia'],
  [33, '2026-06-20T16:00:00-04:00', 'Germany', 'Ivory Coast', 'BMO Field, Toronto'],
  [34, '2026-06-20T19:00:00-05:00', 'Ecuador', 'Curaçao', 'Arrowhead Stadium, Kansas City'],
  [55, '2026-06-25T16:00:00-04:00', 'Curaçao', 'Ivory Coast', 'Lincoln Financial Field, Philadelphia'],
  [56, '2026-06-25T16:00:00-04:00', 'Ecuador', 'Germany', 'MetLife Stadium, East Rutherford'],

  [11, '2026-06-14T15:00:00-05:00', 'Netherlands', 'Japan', 'AT&T Stadium, Arlington'],
  [12, '2026-06-14T20:00:00-06:00', 'Sweden', 'Tunisia', 'Estadio BBVA, Guadalupe'],
  [35, '2026-06-20T12:00:00-05:00', 'Netherlands', 'Sweden', 'NRG Stadium, Houston'],
  [36, '2026-06-20T22:00:00-06:00', 'Tunisia', 'Japan', 'Estadio BBVA, Guadalupe'],
  [57, '2026-06-25T18:00:00-05:00', 'Japan', 'Sweden', 'AT&T Stadium, Arlington'],
  [58, '2026-06-25T18:00:00-05:00', 'Tunisia', 'Netherlands', 'Arrowhead Stadium, Kansas City'],

  [16, '2026-06-15T12:00:00-07:00', 'Belgium', 'Egypt', 'Lumen Field, Seattle'],
  [15, '2026-06-15T18:00:00-07:00', 'Iran', 'New Zealand', 'SoFi Stadium, Inglewood'],
  [39, '2026-06-21T12:00:00-07:00', 'Belgium', 'Iran', 'SoFi Stadium, Inglewood'],
  [40, '2026-06-21T18:00:00-07:00', 'New Zealand', 'Egypt', 'BC Place, Vancouver'],
  [63, '2026-06-26T20:00:00-07:00', 'Egypt', 'Iran', 'Lumen Field, Seattle'],
  [64, '2026-06-26T20:00:00-07:00', 'New Zealand', 'Belgium', 'BC Place, Vancouver'],

  [14, '2026-06-15T12:00:00-04:00', 'Spain', 'Cape Verde', 'Mercedes-Benz Stadium, Atlanta'],
  [13, '2026-06-15T18:00:00-04:00', 'Saudi Arabia', 'Uruguay', 'Hard Rock Stadium, Miami Gardens'],
  [38, '2026-06-21T12:00:00-04:00', 'Spain', 'Saudi Arabia', 'Mercedes-Benz Stadium, Atlanta'],
  [37, '2026-06-21T18:00:00-04:00', 'Uruguay', 'Cape Verde', 'Hard Rock Stadium, Miami Gardens'],
  [65, '2026-06-26T19:00:00-05:00', 'Cape Verde', 'Saudi Arabia', 'NRG Stadium, Houston'],
  [66, '2026-06-26T18:00:00-06:00', 'Uruguay', 'Spain', 'Estadio Akron, Zapopan'],

  [17, '2026-06-16T15:00:00-04:00', 'France', 'Senegal', 'MetLife Stadium, East Rutherford'],
  [18, '2026-06-16T18:00:00-04:00', 'Iraq', 'Norway', 'Gillette Stadium, Foxborough'],
  [42, '2026-06-22T17:00:00-04:00', 'France', 'Iraq', 'Lincoln Financial Field, Philadelphia'],
  [41, '2026-06-22T20:00:00-04:00', 'Norway', 'Senegal', 'MetLife Stadium, East Rutherford'],
  [61, '2026-06-26T15:00:00-04:00', 'Norway', 'France', 'Gillette Stadium, Foxborough'],
  [62, '2026-06-26T15:00:00-04:00', 'Senegal', 'Iraq', 'BMO Field, Toronto'],

  [19, '2026-06-16T20:00:00-05:00', 'Argentina', 'Algeria', 'Arrowhead Stadium, Kansas City'],
  [20, '2026-06-16T21:00:00-07:00', 'Austria', 'Jordan', "Levi's Stadium, Santa Clara"],
  [43, '2026-06-22T12:00:00-05:00', 'Argentina', 'Austria', 'AT&T Stadium, Arlington'],
  [44, '2026-06-22T20:00:00-07:00', 'Jordan', 'Algeria', "Levi's Stadium, Santa Clara"],
  [69, '2026-06-27T21:00:00-05:00', 'Algeria', 'Austria', 'Arrowhead Stadium, Kansas City'],
  [70, '2026-06-27T21:00:00-05:00', 'Jordan', 'Argentina', 'AT&T Stadium, Arlington'],

  [23, '2026-06-17T12:00:00-05:00', 'Portugal', 'DR Congo', 'NRG Stadium, Houston'],
  [24, '2026-06-17T20:00:00-06:00', 'Uzbekistan', 'Colombia', 'Estadio Azteca, Mexico City'],
  [47, '2026-06-23T12:00:00-05:00', 'Portugal', 'Uzbekistan', 'NRG Stadium, Houston'],
  [48, '2026-06-23T20:00:00-06:00', 'Colombia', 'DR Congo', 'Estadio Akron, Zapopan'],
  [71, '2026-06-27T19:30:00-04:00', 'Colombia', 'Portugal', 'Hard Rock Stadium, Miami Gardens'],
  [72, '2026-06-27T19:30:00-04:00', 'DR Congo', 'Uzbekistan', 'Mercedes-Benz Stadium, Atlanta'],

  [22, '2026-06-17T15:00:00-05:00', 'England', 'Croatia', 'AT&T Stadium, Arlington'],
  [21, '2026-06-17T19:00:00-04:00', 'Ghana', 'Panama', 'BMO Field, Toronto'],
  [45, '2026-06-23T16:00:00-04:00', 'England', 'Ghana', 'Gillette Stadium, Foxborough'],
  [46, '2026-06-23T19:00:00-04:00', 'Panama', 'Croatia', 'BMO Field, Toronto'],
  [67, '2026-06-27T17:00:00-04:00', 'Panama', 'England', 'MetLife Stadium, East Rutherford'],
  [68, '2026-06-27T17:00:00-04:00', 'Croatia', 'Ghana', 'Lincoln Financial Field, Philadelphia'],
];

async function main() {
  const teamByName = new Map();

  for (const [group, teams] of Object.entries(groups)) {
    for (const name of teams) {
      const team = await prisma.team.upsert({
        where: { name },
        update: { group },
        create: { name, group },
      });
      teamByName.set(name, team);
    }
  }

  for (const [matchNumber, startsAt, home, away, stadium] of fixtures) {
    const homeTeam = teamByName.get(home) || await prisma.team.findUnique({ where: { name: home } });
    const awayTeam = teamByName.get(away) || await prisma.team.findUnique({ where: { name: away } });
    if (!homeTeam || !awayTeam) throw new Error(`Missing team for match ${matchNumber}`);
    await prisma.match.upsert({
      where: { matchNumber },
      update: {
        round: Round.GROUP_STAGE,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startsAt: new Date(startsAt),
        stadium,
      },
      create: {
        matchNumber,
        round: Round.GROUP_STAGE,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        startsAt: new Date(startsAt),
        stadium,
      },
    });
  }

  console.log(`Seeded ${Object.values(groups).flat().length} teams and ${fixtures.length} group-stage matches.`);
  console.log('Groups A-L and all 72 group-stage matches are loaded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
