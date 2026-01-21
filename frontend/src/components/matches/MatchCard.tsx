'use client';

import { Match, MatchStatus } from '@/types';
import { Card, Badge, getMatchStatusVariant } from '@/components/ui';

interface MatchCardProps {
  match: Match;
  onEditResult: (match: Match) => void;
}

export function MatchCard({ match, onEditResult }: MatchCardProps) {
  const team1Name = `${match.player1?.name || 'Player 1'} & ${match.player2?.name || 'Player 2'}`;
  const team2Name = `${match.player3?.name || 'Player 3'} & ${match.player4?.name || 'Player 4'}`;

  const hasResult = match.set1Team1 !== null && match.set1Team2 !== null;
  const team1Score = match.set1Team1 ?? '-';
  const team2Score = match.set1Team2 ?? '-';

  const isTeam1Winner = match.winnerTeam === 1;
  const isTeam2Winner = match.winnerTeam === 2;

  return (
    <Card padding="sm" className="relative">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Match {match.matchNumber}</span>
        <Badge variant={getMatchStatusVariant(match.status)} className="text-xs">
          {match.status}
        </Badge>
      </div>

      <div className="space-y-2">
        {/* Team 1 */}
        <div className={`flex items-center justify-between p-2 rounded ${isTeam1Winner ? 'bg-green-50' : ''}`}>
          <span className={`text-sm ${isTeam1Winner ? 'font-semibold text-green-700' : 'text-gray-700'}`}>
            {team1Name}
          </span>
          <span className={`text-lg font-bold ${isTeam1Winner ? 'text-green-700' : 'text-gray-900'}`}>
            {team1Score}
          </span>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between p-2 rounded ${isTeam2Winner ? 'bg-green-50' : ''}`}>
          <span className={`text-sm ${isTeam2Winner ? 'font-semibold text-green-700' : 'text-gray-700'}`}>
            {team2Name}
          </span>
          <span className={`text-lg font-bold ${isTeam2Winner ? 'text-green-700' : 'text-gray-900'}`}>
            {team2Score}
          </span>
        </div>
      </div>

      <button
        onClick={() => onEditResult(match)}
        className="mt-3 w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {hasResult ? 'Edit Result' : 'Enter Result'}
      </button>
    </Card>
  );
}
