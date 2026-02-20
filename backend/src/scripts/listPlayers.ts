import prisma from '../lib/prisma';

async function listPlayers() {
  const players = await prisma.player.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${players.length} players:`);
  players.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
  });

  await prisma.$disconnect();
}

listPlayers();
