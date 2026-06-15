import { prisma } from "../lib/db.js";

async function main() {
  const actuals = await prisma.actualQualifiedTeam.findMany({
    include: { team: true },
  });
  
  if (actuals.length === 0) {
    console.log("No qualified teams have been recorded yet.");
    return;
  }

  console.log("Currently qualified teams:");
  actuals.forEach(a => {
    console.log(`- ${a.team.name} (Type: ${a.type})`);
  });
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
