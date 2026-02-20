import prisma from '../lib/prisma';

async function clearHistorical() {
  const tournament = await prisma.tournament.findFirst({
    where: { name: '[HISTORICAL] 2025 Season Points' },
  });

  if (tournament) {
    await prisma.tournamentResult.deleteMany({
      where: { tournamentId: tournament.id },
    });
    await prisma.tournament.delete({
      where: { id: tournament.id },
    });
    console.log('✅ Deleted historical tournament and all results');
  } else {
    console.log('ℹ️  No historical tournament found');
  }

  await prisma.$disconnect();
}

clearHistorical();
