'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

interface Player {
  id: string;
  name: string;
}

interface TeamStanding {
  player1Id: string;
  player2Id: string;
  player1?: Player;
  player2?: Player;
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  points?: number;
  gamesWon?: number;
  gamesLost?: number;
  position?: number;
  tournamentPointsAwarded?: number;
  bonusPoints?: number;
}

interface Tournament {
  id: string;
  name: string;
  type: string;
  status: string;
}

export default function TournamentStandingsPage() {
  const params = useParams();
  const router = useRouter();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      const [tournamentRes, standingsRes] = await Promise.all([
        apiClient.get(`/api/tournaments/${params.id}`),
        apiClient.get(`/api/tournaments/${params.id}/standings`),
      ]);
      setTournament(tournamentRes.data);

      // Sort standings
      let sortedStandings = standingsRes.data;

      // Check if it's knockout format (has position property)
      if (sortedStandings.length > 0 && sortedStandings[0].position !== undefined) {
        // Sort by position
        sortedStandings = sortedStandings.sort((a: TeamStanding, b: TeamStanding) =>
          (a.position || 0) - (b.position || 0)
        );
      } else {
        // Sort by points, then goal difference
        sortedStandings = sortedStandings.sort((a: TeamStanding, b: TeamStanding) => {
          if ((b.points || 0) !== (a.points || 0)) {
            return (b.points || 0) - (a.points || 0);
          }
          const aGameDiff = (a.gamesWon || 0) - (a.gamesLost || 0);
          const bGameDiff = (b.gamesWon || 0) - (b.gamesLost || 0);
          return bGameDiff - aGameDiff;
        });
      }

      setStandings(sortedStandings);
    } catch (err) {
      console.error('Failed to load standings', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading standings...</p>
      </div>
    );
  }

  if (!tournament) {
    return <div className="px-4">Tournament not found</div>;
  }

  const isKnockout = tournament.type === 'KNOCKOUT' ||
    (tournament.type === 'GROUP_STAGE_KNOCKOUT' && standings.length > 0 && standings[0].position !== undefined);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Tournament
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {tournament.name} - Final Classification
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Tournament Type: {tournament.type.replace(/_/g, ' ')}
        </p>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              {tournament.status === 'FINISHED' && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tournament Points
                </th>
              )}
              {!isKnockout && (
                <>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Played
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Won
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lost
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Games +/-
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {standings.map((standing, index) => {
              const position = standing.position || index + 1;
              const gameDiff = (standing.gamesWon || 0) - (standing.gamesLost || 0);

              return (
                <tr key={`${standing.player1Id}-${standing.player2Id}`} className={position <= 3 ? 'bg-yellow-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">{position}</span>
                      {position <= 3 && <span className="text-xl">{getMedalIcon(position)}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {standing.player1?.name || 'Player 1'} & {standing.player2?.name || 'Player 2'}
                    </div>
                  </td>
                  {tournament.status === 'FINISHED' && (
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-bold text-primary">
                        {((standing.tournamentPointsAwarded || 0) + (standing.bonusPoints || 0)).toFixed(1)}
                      </div>
                      {(standing.bonusPoints || 0) > 0 && (
                        <div className="text-xs text-gray-500">
                          ({standing.tournamentPointsAwarded?.toFixed(1)} + {standing.bonusPoints?.toFixed(1)} bonus)
                        </div>
                      )}
                    </td>
                  )}
                  {!isKnockout && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {standing.matchesPlayed || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 font-medium">
                        {standing.matchesWon || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {standing.matchesLost || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900">
                        {standing.points || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <span className={gameDiff > 0 ? 'text-green-600 font-medium' : gameDiff < 0 ? 'text-red-600' : 'text-gray-500'}>
                          {gameDiff > 0 ? '+' : ''}{gameDiff}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isKnockout && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Tiebreaker Rules</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Points (2 per win)</li>
            <li>Goal difference (games won - games lost)</li>
            <li>Total games won</li>
          </ol>
        </div>
      )}
    </div>
  );
}
