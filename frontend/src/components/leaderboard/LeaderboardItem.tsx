'use client';

import { Medal, Trophy, Target, Star } from 'lucide-react';
import { Player } from '@/types';
import { clsx } from 'clsx';

interface LeaderboardItemProps {
  player: Player;
  rank: number;
}

function getRankColor(rank: number): string {
  if (rank === 1) return 'bg-yellow-50 border-yellow-400';
  if (rank === 2) return 'bg-gray-50 border-gray-400';
  if (rank === 3) return 'bg-orange-50 border-orange-400';
  return 'bg-white border-gray-200';
}

function getRankBadge(rank: number): React.ReactNode {
  if (rank === 1) return <Medal className="h-6 w-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
  if (rank === 3) return <Medal className="h-6 w-6 text-orange-500" />;
  return <span className="text-lg font-bold text-gray-500">{rank}</span>;
}

export function LeaderboardItem({ player, rank }: LeaderboardItemProps) {
  const gameDiff = player.stats
    ? player.stats.gamesWon - player.stats.gamesLost
    : 0;

  return (
    <div
      className={clsx(
        'border-l-4 rounded-lg p-5 shadow-sm transition-shadow hover:shadow-md',
        getRankColor(rank)
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 flex justify-center">{getRankBadge(rank)}</div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">{player.name}</h3>
            {player.stats && (
              <p className="text-sm text-gray-500">
                {player.stats.matchesWon}W - {player.stats.matchesLost}L
                {player.stats.winPercentage > 0 && ` (${player.stats.winPercentage.toFixed(0)}%)`}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          {player.stats && (
            <>
              <div className="text-3xl font-bold text-primary">
                {player.stats.tournamentPoints || 0}
              </div>
              <div className="text-sm text-gray-500">
                points
              </div>
            </>
          )}
        </div>
      </div>
      {player.stats && (
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Win %</p>
              <p className="font-medium">{player.stats.winPercentage.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Games</p>
              <p className={clsx('font-medium', gameDiff > 0 ? 'text-green-600' : gameDiff < 0 ? 'text-red-600' : '')}>
                {player.stats.gamesWon}-{player.stats.gamesLost}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Tournaments</p>
              <p className="font-medium">{player.stats.tournamentsPlayed || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Medal className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-500">Wins</p>
              <p className="font-medium">{player.stats.tournamentsWon || 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
