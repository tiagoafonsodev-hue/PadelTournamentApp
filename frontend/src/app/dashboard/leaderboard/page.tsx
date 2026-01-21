'use client';

import { BarChart3 } from 'lucide-react';
import { useLeaderboard } from '@/hooks/queries';
import { LeaderboardItem } from '@/components/leaderboard/LeaderboardItem';
import { Spinner, EmptyState, PageHeader } from '@/components/ui';

export default function LeaderboardPage() {
  const { data: players, isLoading } = useLeaderboard();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <PageHeader
        title="Leaderboard"
        description="Top players ranked by tournament points"
      />

      {!players || players.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No statistics yet"
          description="Play some tournaments to see rankings!"
        />
      ) : (
        <div className="space-y-4">
          {players.map((player, index) => (
            <LeaderboardItem key={player.id} player={player} rank={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
