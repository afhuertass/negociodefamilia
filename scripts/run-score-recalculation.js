const { scoreGroupStage } = require("../lib/scoring");
const { prisma } = require("../lib/db");

async function main() {
  console.log("Recalculating group stage scores...");
  await scoreGroupStage();
  console.log("Recalculation complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
