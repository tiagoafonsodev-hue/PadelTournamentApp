'use client';

import { Mail, Phone, Pencil, Trash2 } from 'lucide-react';
import { Player } from '@/types';
import { Card } from '@/components/ui';

interface PlayerCardProps {
  player: Player;
  onEdit: (player: Player) => void;
  onDelete: (id: string) => void;
}

export function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  return (
    <Card>
      <h3 className="text-lg font-medium text-gray-900">{player.name}</h3>

      {player.email && (
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <Mail className="h-4 w-4" />
          <span>{player.email}</span>
        </div>
      )}

      {player.phoneNumber && (
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          <Phone className="h-4 w-4" />
          <span>{player.phoneNumber}</span>
        </div>
      )}

      {player.stats && (
        <div className="mt-3 text-sm text-gray-700 space-y-1">
          <p>Matches: {player.stats.totalMatches}</p>
          <p>
            Record: {player.stats.matchesWon}-{player.stats.matchesLost}
          </p>
          <p>Win Rate: {player.stats.winPercentage.toFixed(1)}%</p>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => onEdit(player)}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </button>
        <button
          onClick={() => onDelete(player.id)}
          className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>
    </Card>
  );
}
