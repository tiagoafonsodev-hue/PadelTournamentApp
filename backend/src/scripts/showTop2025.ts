import prisma from '../lib/prisma';

async function showTop() {
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
    take: 30,
  });

  const total = await prisma.tournamentResult.count({
    where: {
      createdAt: {
        gte: new Date('2025-01-01'),
        lt: new Date('2026-01-01'),
      },
    },
  });

  console.log('=== Top 30 Players by 2025 Points ===\n');
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.player.name}: ${r.pointsAwarded} pts`);
  });
  console.log(`\nTotal: ${total} players with 2025 points`);

  await prisma.$disconnect();
}

showTop();
