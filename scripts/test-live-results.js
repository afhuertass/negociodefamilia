/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching live results from https://worldcup26.ir/get/games ...');
  
  let response;
  try {
    response = await fetch("https://worldcup26.ir/get/games");
  } catch (err) {
    console.error('Failed to fetch from API:', err.message);
    process.exit(1);
  }

  let data = await response.json();
  let games = Array.isArray(data) ? data : (data && Array.isArray(data.games) ? data.games : null);
  
  if (!games) {
    console.error('API did not return an array or games array. Returned:', data);
    process.exit(1);
  }

  console.log(`Successfully fetched ${games.length} games from the API.`);

  // Load matches with their teams
  const matches = await prisma.match.findMany({
    include: { homeTeam: true, awayTeam: true }
  });

  console.log(`Loaded ${matches.length} matches from the local database.\n`);
  console.log('--- DRY RUN MATCHING RESULTS ---');

  let matchedCount = 0;
  let finishedAndMatched = 0;
  let unMatchedFinished = [];

  // Match the API games
  for (const match of matches) {
    const apiMatch = games.find((d) => {
      if (match.homeTeam?.name && match.awayTeam?.name) {
        const apiHome = String(d.home_team_name_en || d.home_team_label || "").trim().toLowerCase();
        const apiAway = String(d.away_team_name_en || d.away_team_label || "").trim().toLowerCase();
        const dbHome = String(match.homeTeam.name).trim().toLowerCase();
        const dbAway = String(match.awayTeam.name).trim().toLowerCase();
        if (apiHome === dbHome && apiAway === dbAway) return true;
      }
      return String(d.id) === String(match.matchNumber);
    });

    if (apiMatch) {
      matchedCount++;
      const isFinished = apiMatch.finished === "TRUE" || apiMatch.finished === true;
      
      console.log(`Local Match #${match.matchNumber} (${match.round}):`);
      console.log(`  DB Teams : ${match.homeTeam?.name || match.homeSlot || 'N/A'} vs ${match.awayTeam?.name || match.awaySlot || 'N/A'}`);
      console.log(`  API Teams: ${apiMatch.home_team_name_en || apiMatch.home_team_label} vs ${apiMatch.away_team_name_en || apiMatch.away_team_label}`);
      console.log(`  API Game : ID: ${apiMatch.id}, Finished: ${apiMatch.finished}, Score: ${apiMatch.home_score} - ${apiMatch.away_score}`);
      
      if (isFinished) {
        finishedAndMatched++;
        console.log(`  👉 ACTION: Would update DB result to ${apiMatch.home_score} - ${apiMatch.away_score} and mark finished.`);
      } else {
        console.log(`  👉 ACTION: Game not finished yet. No DB updates.`);
      }
      console.log();
    }
  }

  // Find any finished games in the API that didn't match our database
  for (const d of games) {
    const isFinished = d.finished === "TRUE" || d.finished === true;
    if (isFinished) {
      const matchInDb = matches.find((m) => {
        if (m.homeTeam?.name && m.awayTeam?.name) {
          const apiHome = String(d.home_team_name_en || d.home_team_label || "").trim().toLowerCase();
          const apiAway = String(d.away_team_name_en || d.away_team_label || "").trim().toLowerCase();
          const dbHome = String(m.homeTeam.name).trim().toLowerCase();
          const dbAway = String(m.awayTeam.name).trim().toLowerCase();
          if (apiHome === dbHome && apiAway === dbAway) return true;
        }
        return String(d.id) === String(m.matchNumber);
      });

      if (!matchInDb) {
        unMatchedFinished.push(d);
      }
    }
  }

  console.log('--- SUMMARY ---');
  console.log(`Total DB Matches matched with API entries: ${matchedCount}/${matches.length}`);
  console.log(`Matches that are finished & would be updated : ${finishedAndMatched}`);
  
  if (unMatchedFinished.length > 0) {
    console.log(`\n⚠️  API games marked as finished but NOT matched in DB (${unMatchedFinished.length}):`);
    for (const d of unMatchedFinished) {
      console.log(`  API Game #${d.id}: ${d.home_team_name_en || d.home_team_label} (${d.home_score}) vs ${d.away_team_name_en || d.away_team_label} (${d.away_score})`);
    }
  } else {
    console.log('\n✅ No unmatched finished games. All match mappings are 100% clean.');
  }
}

main()
  .catch((e) => {
    console.error('Error running test script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
