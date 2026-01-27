'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { Player, TournamentType, TournamentCategory } from '@/types';

interface Team {
  player1Id: string;
  player2Id: string;
}

export default function CreateTournamentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [playerCount, setPlayerCount] = useState<number>(8);
  const [name, setName] = useState('');
  const [type, setType] = useState<TournamentType>(TournamentType.ROUND_ROBIN);
  const [category, setCategory] = useState<TournamentCategory>(TournamentCategory.OPEN_250);
  const [allowTies, setAllowTies] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPlayers = useCallback(async () => {
    try {
      const url = search
        ? `/api/players?search=${encodeURIComponent(search)}`
        : '/api/players';
      const response = await apiClient.get(url);
      setPlayers(response.data);
    } catch (err) {
      console.error('Failed to load players', err);
    }
  }, [search]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Initialize empty teams when player count changes
  useEffect(() => {
    const teamCount = playerCount / 2;
    const newTeams: Team[] = [];
    for (let i = 0; i < teamCount; i++) {
      newTeams.push({ player1Id: '', player2Id: '' });
    }
    setTeams(newTeams);
  }, [playerCount]);

  const getAvailableTournamentTypes = (count: number): TournamentType[] => {
    switch (count) {
      case 8:
        return [TournamentType.ROUND_ROBIN, TournamentType.KNOCKOUT, TournamentType.GROUP_STAGE_KNOCKOUT];
      case 12:
        return [TournamentType.ROUND_ROBIN];
      case 16:
      case 24:
        return [TournamentType.KNOCKOUT, TournamentType.GROUP_STAGE_KNOCKOUT];
      default:
        return [TournamentType.ROUND_ROBIN];
    }
  };

  const getTeamCount = (count: number): number => {
    return count / 2;
  };

  // Get all player IDs that are already assigned to a team
  const getAssignedPlayerIds = (): Set<string> => {
    const assigned = new Set<string>();
    teams.forEach(team => {
      if (team.player1Id) assigned.add(team.player1Id);
      if (team.player2Id) assigned.add(team.player2Id);
    });
    return assigned;
  };

  // Get available players for a specific slot (excluding already assigned, except current value)
  const getAvailablePlayersForSlot = (currentValue: string): Player[] => {
    const assigned = getAssignedPlayerIds();
    return players
      .filter(p => p.id === currentValue || !assigned.has(p.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const updateTeam = (index: number, field: 'player1Id' | 'player2Id', value: string) => {
    const newTeams = [...teams];
    newTeams[index][field] = value;
    setTeams(newTeams);
  };

  const validateTeams = () => {
    // Check all teams have 2 players
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      if (!team.player1Id || !team.player2Id) {
        return `Team ${i + 1} needs 2 players`;
      }
    }
    return null;
  };

  const getSelectedPlayerIds = (): string[] => {
    const ids: string[] = [];
    teams.forEach(team => {
      if (team.player1Id) ids.push(team.player1Id);
      if (team.player2Id) ids.push(team.player2Id);
    });
    return ids;
  };

  const handleSubmit = async () => {
    const teamValidation = validateTeams();
    if (teamValidation) {
      setError(teamValidation);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedPlayerIds = getSelectedPlayerIds();
      const response = await apiClient.post('/api/tournaments', {
        name,
        type,
        category,
        playerCount,
        playerIds: selectedPlayerIds,
        teams,
        allowTies: type !== TournamentType.KNOCKOUT ? allowTies : false,
      });

      router.push(`/dashboard/tournaments/${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  // Category to player count mapping
  const categoryConfig = [
    { category: TournamentCategory.OPEN_250, label: 'Open 250', players: 8, teams: 4 },
    { category: TournamentCategory.OPEN_500, label: 'Open 500', players: 12, teams: 6 },
    { category: TournamentCategory.OPEN_1000, label: 'Open 1000', players: 16, teams: 8 },
    { category: TournamentCategory.MASTERS, label: 'Masters', players: 24, teams: 12 },
  ];

  const handleCategorySelect = (cat: typeof categoryConfig[0]) => {
    setPlayerCount(cat.players);
    setCategory(cat.category);
  };

  // Get grid columns based on team count
  const getGridCols = () => {
    const teamCount = teams.length;
    if (teamCount <= 4) return 'grid-cols-2 md:grid-cols-4';
    if (teamCount <= 6) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
    if (teamCount <= 8) return 'grid-cols-2 md:grid-cols-4';
    return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';
  };

  // Step 1: Tournament Category Selection
  if (step === 1) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Create Tournament - Step 1: Select Category
          </h1>

          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tournament Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categoryConfig.map((cat) => (
                  <div
                    key={cat.category}
                    onClick={() => handleCategorySelect(cat)}
                    className={`cursor-pointer border-2 rounded-lg p-4 text-center ${
                      category === cat.category
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl font-bold">{cat.label}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {cat.teams} teams
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
              >
                Next: Tournament Info
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Name and Type
  if (step === 2) {
    const availableTypes = getAvailableTournamentTypes(playerCount);

    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Create Tournament - Step 2: Basic Info
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            {playerCount} players - {getTeamCount(playerCount)} teams
          </p>

          <div className="bg-white shadow rounded-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
                placeholder="Enter tournament name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tournament Type *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {availableTypes.includes(TournamentType.ROUND_ROBIN) && (
                  <div
                    onClick={() => setType(TournamentType.ROUND_ROBIN)}
                    className={`cursor-pointer border-2 rounded-lg p-4 ${
                      type === TournamentType.ROUND_ROBIN
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Round Robin</div>
                    <div className="text-sm text-gray-600 mt-1">
                      All teams play each other
                    </div>
                  </div>
                )}

                {availableTypes.includes(TournamentType.KNOCKOUT) && (
                  <div
                    onClick={() => {
                      setType(TournamentType.KNOCKOUT);
                      setAllowTies(false);
                    }}
                    className={`cursor-pointer border-2 rounded-lg p-4 ${
                      type === TournamentType.KNOCKOUT
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Knockout</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Progressive elimination
                    </div>
                  </div>
                )}

                {availableTypes.includes(TournamentType.GROUP_STAGE_KNOCKOUT) && (
                  <div
                    onClick={() => setType(TournamentType.GROUP_STAGE_KNOCKOUT)}
                    className={`cursor-pointer border-2 rounded-lg p-4 ${
                      type === TournamentType.GROUP_STAGE_KNOCKOUT
                        ? 'border-primary bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">Round Robin + Playoffs</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Groups then knockout
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Allow Ties option */}
            {type !== TournamentType.KNOCKOUT && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowTies}
                    onChange={(e) => setAllowTies(e.target.checked)}
                    className="h-4 w-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Allow ties in group stage
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ties award 1 point (vs 2 for win)
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!name}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                Next: Create Teams
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Create Teams (merged with player selection)
  const teamValidation = validateTeams();
  const assignedCount = getSelectedPlayerIds().length;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Create Tournament - Step 3: Create Teams
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          {name} - Select players for each team ({assignedCount}/{playerCount} players assigned)
        </p>

        <div className="bg-white shadow rounded-lg p-6">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border rounded-md text-sm"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Teams Grid */}
          <div className={`grid gap-4 ${getGridCols()}`}>
            {teams.map((team, index) => (
              <div key={index} className="border rounded-lg p-3 bg-gray-50">
                <div className="font-medium text-sm mb-2 text-center text-gray-700">
                  Team {index + 1}
                </div>
                <div className="space-y-2">
                  <select
                    value={team.player1Id}
                    onChange={(e) => updateTeam(index, 'player1Id', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm px-2 py-1.5 border"
                  >
                    <option value="">Player 1</option>
                    {getAvailablePlayersForSlot(team.player1Id).map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={team.player2Id}
                    onChange={(e) => updateTeam(index, 'player2Id', e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm px-2 py-1.5 border"
                  >
                    <option value="">Player 2</option>
                    {getAvailablePlayersForSlot(team.player2Id).map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          {teamValidation && (
            <p className="text-sm text-red-600 mt-4">{teamValidation}</p>
          )}

          <div className="flex gap-3 justify-end pt-6 border-t mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !!teamValidation}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
