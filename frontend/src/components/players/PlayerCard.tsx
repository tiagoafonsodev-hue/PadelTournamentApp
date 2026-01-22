'use client';

import { Mail, Phone, Pencil, Trash2, User } from 'lucide-react';
import Link from 'next/link';
import { Player } from '@/types';
import { Card } from '@/components/ui';

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (id: string) => void;
  isOwnProfile?: boolean;
}

export function PlayerCard({ player, onEdit, onDelete, isOwnProfile }: PlayerCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-medium text-gray-900">{player.name}</h3>
        {isOwnProfile && (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
            <User className="h-3 w-3 mr-1" />
            You
          </span>
        )}
      </div>

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
        {onEdit && (
          <button
            onClick={() => onEdit(player)}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(player.id)}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
        {isOwnProfile && (
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Link>
        )}
      </div>
    </Card>
  );
}
