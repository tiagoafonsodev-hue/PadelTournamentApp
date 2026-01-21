'use client';

import { useState, useEffect } from 'react';
import { Match, MatchResultInput } from '@/types';
import { Modal, Button, Input } from '@/components/ui';

interface MatchResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: MatchResultInput) => void;
  match: Match | null;
  isLoading?: boolean;
  allowTies?: boolean;
}

export function MatchResultModal({
  isOpen,
  onClose,
  onSubmit,
  match,
  isLoading = false,
  allowTies = false,
}: MatchResultModalProps) {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (match) {
      setTeam1Score(match.set1Team1 ?? 0);
      setTeam2Score(match.set1Team2 ?? 0);
      setError('');
    }
  }, [match, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (team1Score === team2Score && !allowTies) {
      setError('Scores cannot be tied. One team must win.');
      return;
    }

    onSubmit({ team1Score, team2Score });
  };

  if (!match) return null;

  const team1Name = `${match.player1?.name || 'Player 1'} & ${match.player2?.name || 'Player 2'}`;
  const team2Name = `${match.player3?.name || 'Player 3'} & ${match.player4?.name || 'Player 4'}`;

  const isTie = team1Score === team2Score && allowTies;
  const winner = team1Score > team2Score ? team1Name : team2Score > team1Score ? team2Name : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Enter Match Result">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Team 1 */}
          <div className="flex items-center justify-between gap-4">
            <span className="flex-1 font-medium text-gray-900">{team1Name}</span>
            <input
              type="number"
              min={0}
              max={99}
              value={team1Score}
              onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
              className="w-20 text-center text-lg font-bold border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="text-center text-gray-400 text-sm">vs</div>

          {/* Team 2 */}
          <div className="flex items-center justify-between gap-4">
            <span className="flex-1 font-medium text-gray-900">{team2Name}</span>
            <input
              type="number"
              min={0}
              max={99}
              value={team2Score}
              onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
              className="w-20 text-center text-lg font-bold border rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        {winner && (
          <div className="text-center text-sm text-green-600 font-medium">
            Winner: {winner}
          </div>
        )}

        {isTie && team1Score > 0 && (
          <div className="text-center text-sm text-yellow-600 font-medium">
            Tie - Each team gets 1 point
          </div>
        )}

        {error && (
          <div className="text-center text-sm text-red-600">{error}</div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isLoading}>
            Save Result
          </Button>
        </div>
      </form>
    </Modal>
  );
}
