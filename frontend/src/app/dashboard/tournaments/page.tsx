'use client';

import { useRouter } from 'next/navigation';
import { Plus, Trophy } from 'lucide-react';
import { useTournaments } from '@/hooks/queries';
import { useDeleteTournament } from '@/hooks/mutations';
import { useToast } from '@/providers';
import { TournamentCard } from '@/components/tournaments/TournamentCard';
import { Button, Spinner, EmptyState, PageHeader } from '@/components/ui';

export default function TournamentsPage() {
  const router = useRouter();
  const { data: tournaments, isLoading, error } = useTournaments();
  const deleteMutation = useDeleteTournament();
  const { showToast } = useToast();

  const handleDelete = async (tournamentId: string, tournamentName: string) => {
    if (!confirm(`Are you sure you want to delete "${tournamentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(tournamentId);
      showToast('Tournament deleted successfully', 'success');
    } catch {
      showToast('Failed to delete tournament', 'error');
    }
  };

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
        title="Tournaments"
        description="Manage your padel tournaments"
        action={
          <Button onClick={() => router.push('/dashboard/tournaments/create')}>
            <Plus className="h-4 w-4" />
            Create Tournament
          </Button>
        }
      />

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Failed to load tournaments</p>
        </div>
      )}

      {!tournaments || tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Create your first tournament to get started!"
          action={
            <Button onClick={() => router.push('/dashboard/tournaments/create')}>
              <Plus className="h-4 w-4" />
              Create Tournament
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
