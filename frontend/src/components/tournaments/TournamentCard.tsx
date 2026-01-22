'use client';

import { useRouter } from 'next/navigation';
import { Calendar, Users, Trash2, ChevronRight } from 'lucide-react';
import { Tournament } from '@/types';
import { Card, Badge, getTournamentStatusVariant } from '@/components/ui';

interface TournamentCardProps {
  tournament: Tournament;
  onDelete?: (id: string, name: string) => void;
}

function getTypeLabel(type: string): string {
  switch (type) {
    case 'ROUND_ROBIN':
      return 'Round Robin';
    case 'KNOCKOUT':
      return 'Knockout';
    case 'GROUP_STAGE_KNOCKOUT':
      return 'Group Stage + Knockout';
    default:
      return type;
  }
}

export function TournamentCard({ tournament, onDelete }: TournamentCardProps) {
  const router = useRouter();

  return (
    <Card
      hover
      className="cursor-pointer"
      onClick={() => router.push(`/dashboard/tournaments/${tournament.id}`)}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900 truncate">
          {tournament.name}
        </h3>
        <Badge variant={getTournamentStatusVariant(tournament.status)}>
          {tournament.status.replace(/_/g, ' ')}
        </Badge>
      </div>
      <div className="space-y-2 text-sm text-gray-500">
        <p>{getTypeLabel(tournament.type)}</p>
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          <span>{tournament.players?.length || 0} players</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Phase {tournament.currentPhase} of {tournament.maxPhases}</span>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/dashboard/tournaments/${tournament.id}`);
          }}
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View Details
          <ChevronRight className="h-4 w-4" />
        </button>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(tournament.id, tournament.name);
            }}
            className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            title="Delete tournament"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </Card>
  );
}
