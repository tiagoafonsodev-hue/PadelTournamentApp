'use client';

import { useState } from 'react';
import { Plus, Users, Search } from 'lucide-react';
import { Player } from '@/types';
import { usePlayers } from '@/hooks/queries';
import { useCreatePlayer, useUpdatePlayer, useDeletePlayer } from '@/hooks/mutations';
import { useToast } from '@/providers';
import { PlayerCard } from '@/components/players/PlayerCard';
import { PlayerFormModal } from '@/components/players/PlayerFormModal';
import { Button, Spinner, EmptyState, PageHeader, Input } from '@/components/ui';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { showToast } = useToast();

  const { data: players, isLoading } = usePlayers(search);
  const createMutation = useCreatePlayer();
  const updateMutation = useUpdatePlayer();
  const deleteMutation = useDeletePlayer();

  const handleSubmit = async (data: { name: string; email: string; phoneNumber: string }) => {
    try {
      if (editingPlayer) {
        await updateMutation.mutateAsync({ id: editingPlayer.id, ...data });
        showToast('Player updated successfully', 'success');
      } else {
        await createMutation.mutateAsync(data);
        showToast('Player created successfully', 'success');
      }
      setShowForm(false);
      setEditingPlayer(null);
    } catch {
      showToast('Failed to save player', 'error');
    }
  };

  const handleEdit = (player: Player) => {
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Player deleted successfully', 'success');
    } catch {
      showToast('Failed to delete player', 'error');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPlayer(null);
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
        title="Players"
        description="Manage your players database"
        action={
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Player
          </Button>
        }
      />

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      <PlayerFormModal
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        player={editingPlayer}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {!players || players.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No players found"
          description={search ? 'Try a different search term' : 'Add your first player!'}
          action={
            !search && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Add Player
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
