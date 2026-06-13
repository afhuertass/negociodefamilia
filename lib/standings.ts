import { Match, MatchResult, Team } from "@prisma/client";

export interface TeamStanding {
  teamId: string;
  name: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function calculateGroupStandings(
  teams: Team[],
  matches: (Match & { result: MatchResult | null })[]
): Record<string, TeamStanding[]> {
  const standingsMap: Record<string, TeamStanding> = {};

  // Initialize standings for all teams
  for (const team of teams) {
    standingsMap[team.id] = {
      teamId: team.id,
      name: team.name,
      group: team.group || "Sin grupo",
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  }

  // Calculate standings from matches with results
  for (const match of matches) {
    if (!match.result || !match.homeTeamId || !match.awayTeamId) continue;

    const homeId = match.homeTeamId;
    const awayId = match.awayTeamId;

    const home = standingsMap[homeId];
    const away = standingsMap[awayId];

    if (!home || !away) continue;

    const hGoals = match.result.homeGoals;
    const aGoals = match.result.awayGoals;

    home.played += 1;
    away.played += 1;

    home.goalsFor += hGoals;
    home.goalsAgainst += aGoals;
    away.goalsFor += aGoals;
    away.goalsAgainst += hGoals;

    if (hGoals > aGoals) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (aGoals > hGoals) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      home.points += 1;
      away.drawn += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  }

  // Group by letter
  const groupedStandings: Record<string, TeamStanding[]> = {};

  for (const standing of Object.values(standingsMap)) {
    const grp = standing.group;
    if (!groupedStandings[grp]) {
      groupedStandings[grp] = [];
    }
    groupedStandings[grp].push(standing);
  }

  // Sort each group according to FIFA rules: Points DESC -> GoalDifference DESC -> GoalsFor DESC -> Name ASC
  for (const grp of Object.keys(groupedStandings)) {
    groupedStandings[grp].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });
  }

  return groupedStandings;
}

export function calculateBestThirds(groupedStandings: Record<string, TeamStanding[]>): TeamStanding[] {
  const thirds: TeamStanding[] = [];

  for (const grp of Object.keys(groupedStandings)) {
    const list = groupedStandings[grp];
    if (list.length >= 3) {
      thirds.push(list[2]); // The 3rd place team
    }
  }

  // Sort them
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  return thirds;
}
