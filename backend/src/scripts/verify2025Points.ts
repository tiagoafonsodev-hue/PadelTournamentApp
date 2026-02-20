import prisma from '../lib/prisma';

async function verify2025Points() {
  const results = await prisma.tournamentResult.findMany({
    where: {
      createdAt: {
        gte: new Date('2025-01-01'),
        lt: new Date('2026-01-01'),
      },
    },
    include: {
      player: { select: { name: true } },
    },
    orderBy: {
      pointsAwarded: 'desc',
    },
  });

  console.log('=== 2025 Tournament Points ===\n');
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.player.name}: ${r.pointsAwarded + r.bonusPoints} pts (${r.pointsAwarded} base + ${r.bonusPoints} bonus)`);
  });
  console.log(`\nTotal: ${results.length} players with 2025 points`);

  await prisma.$disconnect();
}

verify2025Points();
