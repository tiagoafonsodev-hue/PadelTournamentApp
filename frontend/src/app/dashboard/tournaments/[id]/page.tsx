'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ChevronDown, ChevronRight, Trophy } from 'lucide-react';
import { Match, MatchResultInput, UserRole } from '@/types';
import { useTournament, useTournamentStandings } from '@/hooks/queries';
import { useSubmitMatchResult } from '@/hooks/mutations';
import { useToast } from '@/providers';
import { MatchResultModal } from '@/components/matches/MatchResultModal';
import { Spinner, Badge, getTournamentStatusVariant } from '@/components/ui';
import { KnockoutBracket } from '@/components/tournaments/KnockoutBracket';

interface TeamStanding {
  player1Id: string;
  player2Id: string;
  player1?: { id: string; name: string };
  player2?: { id: string; name: string };
  matchesPlayed?: number;
  matchesWon?: number;
  matchesLost?: number;
  matchesDrawn?: number;
  points?: number;
  gamesWon?: number;
  gamesLost?: number;
  groupNumber?: number;
  position?: number;
  tournamentPointsAwarded?: number;
  bonusPoints?: number;
}

export default function TournamentDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const { showToast } = useToast();

  const { data: tournament, isLoading } = useTournament(tournamentId);
  const { data: standingsData } = useTournamentStandings(tournamentId);
  const submitResultMutation = useSubmitMatchResult();

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user.role || null);
  }, []);

  const isAdmin = userRole === UserRole.ADMIN;

  // Get standings from API (already sorted by backend)
  const phase1Standings: TeamStanding[] = standingsData || [];

  // Helper function to check if tournament has multiple groups
  const hasMultipleGroups = () => {
    if (!tournament) return false;
    const groupNumbers = new Set(tournament.matches?.map(m => m.groupNumber).filter(g => g != null));
    return groupNumbers.size > 1;
  };

  // Helper function to get unique group numbers from standings
  const getGroupNumbers = () => {
    const groups = new Set<number>();
    phase1Standings.forEach(standing => {
      if (standing.groupNumber !== undefined && standing.groupNumber !== null) {
        groups.add(standing.groupNumber);
      }
    });
    return Array.from(groups).sort();
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const handleSubmitResult = async (result: MatchResultInput) => {
    if (!selectedMatch) return;

    try {
      await submitResultMutation.mutateAsync({
        matchId: selectedMatch.id,
        tournamentId,
        result,
      });
      setSelectedMatch(null);
      showToast('Match result saved', 'success');
    } catch {
      showToast('Failed to submit result', 'error');
    }
  };

  const openMatchDialog = (match: Match) => {
    if (!isAdmin) return; // Only admins can enter results
    setSelectedMatch(match);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tournament) {
    return <div className="px-4">Tournament not found</div>;
  }

  // Group matches by phase, round, matchday, and group
  const groupMatches = () => {
    const groups: Record<string, Match[]> = {};

    tournament.matches?.forEach((match) => {
      let key: string;

      if (tournament.type === 'ROUND_ROBIN' && match.matchDay) {
        // For multi-group Round Robin, include group number
        if (match.groupNumber && hasMultipleGroups()) {
          key = `Group ${match.groupNumber} - Matchday ${match.matchDay}`;
        } else {
          key = `Matchday ${match.matchDay}`;
        }
      } else if (tournament.type === 'GROUP_STAGE_KNOCKOUT') {
        // Group by phase
        if (match.phase === 1) {
          key = match.matchDay ? `Phase 1 - Matchday ${match.matchDay}` : 'Phase 1 - Round Robin';
        } else {
          key = 'Phase 2 - Playoffs';
        }
      } else if (tournament.type === 'KNOCKOUT') {
        // Group by round - handle both 4-team and 8-team knockouts
        const round1Count = tournament.matches?.filter(m => m.roundNumber === 1).length || 0;
        if (round1Count === 4) {
          // 8-team knockout
          if (match.roundNumber === 1) {
            key = 'Round 1 - Quarter-finals';
          } else if (match.roundNumber === 2) {
            key = 'Round 2 - Semi-finals';
          } else {
            key = 'Round 3 - Finals';
          }
        } else {
          // 4-team knockout
          key = match.roundNumber === 1 ? 'Round 1 - Semi-finals' : 'Round 2 - Final & 3rd Place';
        }
      } else {
        key = `Phase ${match.phase} - Round ${match.roundNumber}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
    });

    return groups;
  };

  const groupedMatches = groupMatches();

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {tournament.name}
            </h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>Type: {tournament.type.replace(/_/g, ' ')}</span>
              <span>Status: {tournament.status.replace(/_/g, ' ')}</span>
              <span>
                Phase {tournament.currentPhase} of {tournament.maxPhases}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {tournament.type === 'GROUP_STAGE_KNOCKOUT' && tournament.matches?.some(m => m.phase === 2) && (
              <button
                onClick={() => {
                  const phase2Element = document.getElementById('phase-2-section');
                  phase2Element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Jump to Phase 2
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Final Classification for finished tournaments with playoffs */}
      {tournament.status === 'FINISHED' && (tournament.type === 'GROUP_STAGE_KNOCKOUT' || tournament.type === 'KNOCKOUT') && phase1Standings.some(s => s.position !== undefined) && (
        <div className="bg-gradient-to-br from-yellow-50 to-white border-2 border-yellow-400 shadow-lg rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">Final Classification</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">W-L</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Games</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Base Pts</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bonus</th>
                  <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...phase1Standings]
                  .filter(s => s.position !== undefined)
                  .sort((a, b) => (a.position || 99) - (b.position || 99))
                  .map((standing, index) => {
                    const position = standing.position || index + 1;
                    const basePoints = standing.tournamentPointsAwarded || 0;
                    const bonusPoints = standing.bonusPoints || 0;
                    const totalPoints = basePoints + bonusPoints;
                    const gameDiff = (standing.gamesWon || 0) - (standing.gamesLost || 0);
                    let rowClass = '';
                    let medal = '';
                    if (position === 1) {
                      rowClass = 'bg-yellow-100';
                      medal = '🥇';
                    } else if (position === 2) {
                      rowClass = 'bg-gray-100';
                      medal = '🥈';
                    } else if (position === 3) {
                      rowClass = 'bg-orange-100';
                      medal = '🥉';
                    }

                    return (
                      <tr key={`${standing.player1Id}-${standing.player2Id}`} className={rowClass}>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-lg font-bold">{medal} {position}</span>
                          <span className="text-xs text-gray-500 ml-0.5">
                            {position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm font-medium">
                          {standing.player1?.name || 'Player 1'} & {standing.player2?.name || 'Player 2'}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                          <span className="font-medium text-green-600">{standing.matchesWon || 0}</span>
                          <span className="text-gray-400">-</span>
                          <span className="text-red-600">{standing.matchesLost || 0}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                          <span className="text-gray-600">{standing.gamesWon || 0}-{standing.gamesLost || 0}</span>
                          <span className={`ml-1 text-xs ${gameDiff > 0 ? 'text-green-600' : gameDiff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            ({gameDiff > 0 ? '+' : ''}{gameDiff})
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-medium">
                          {basePoints}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center text-sm">
                          {bonusPoints > 0 ? (
                            <span className="text-green-600 font-medium">+{bonusPoints}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white">
                            {totalPoints}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Show Classification at the top for ROUND_ROBIN and GROUP_STAGE_KNOCKOUT tournaments */}
      {(tournament.type === 'ROUND_ROBIN' || tournament.type === 'GROUP_STAGE_KNOCKOUT') && phase1Standings.length > 0 && (() => {
        const groupNumbers = getGroupNumbers();
        const multiGroup = groupNumbers.length > 1;

        if (multiGroup) {
          // Multi-group display: show groups side by side
          const isGroupStageKnockout = tournament.type === 'GROUP_STAGE_KNOCKOUT';
          return (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {isGroupStageKnockout ? 'Phase 1 Classification by Group' : 'Classification by Group'}
              </h2>
              <div className={`grid gap-6 ${groupNumbers.length === 2 ? 'grid-cols-1 md:grid-cols-2' : groupNumbers.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                {groupNumbers.map(groupNum => {
                  const groupStandings = phase1Standings
                    .filter(s => s.groupNumber === groupNum)
                    .sort((a, b) => {
                      if ((b.points || 0) !== (a.points || 0)) {
                        return (b.points || 0) - (a.points || 0);
                      }
                      const aGameDiff = (a.gamesWon || 0) - (a.gamesLost || 0);
                      const bGameDiff = (b.gamesWon || 0) - (b.gamesLost || 0);
                      return bGameDiff - aGameDiff;
                    });

                  return (
                    <div key={groupNum} className="border rounded-lg p-4">
                      <h3 className="text-md font-semibold text-gray-800 mb-3">Group {groupNum}</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                              <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">+/-</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {groupStandings.map((standing, index) => {
                              const gameDiff = (standing.gamesWon || 0) - (standing.gamesLost || 0);
                              const isQualified = isGroupStageKnockout && index < 2;
                              const rowClass = isGroupStageKnockout
                                ? (index === 0 ? 'bg-green-50' : index === 1 ? 'bg-yellow-50' : '')
                                : '';

                              return (
                                <tr key={`${standing.player1Id}-${standing.player2Id}`} className={rowClass}>
                                  <td className="px-2 py-2 whitespace-nowrap text-xs font-bold">{index + 1}</td>
                                  <td className="px-2 py-2 whitespace-nowrap text-xs">
                                    {standing.player1?.name || 'Player 1'} & {standing.player2?.name || 'Player 2'}
                                  </td>
                                  <td className="px-2 py-2 whitespace-nowrap text-center text-xs">{standing.matchesPlayed || 0}</td>
                                  <td className="px-2 py-2 whitespace-nowrap text-center text-xs font-medium">{standing.matchesWon || 0}</td>
                                  <td className="px-2 py-2 whitespace-nowrap text-center text-xs">{standing.matchesLost || 0}</td>
                                  <td className="px-2 py-2 whitespace-nowrap text-center text-xs font-bold">{standing.points || 0}</td>
                                  <td className={`px-2 py-2 whitespace-nowrap text-center text-xs ${gameDiff > 0 ? 'text-green-600 font-medium' : gameDiff < 0 ? 'text-red-600' : ''}`}>
                                    {gameDiff > 0 ? '+' : ''}{gameDiff}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
              {isGroupStageKnockout && (
                <div className="mt-3 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-50 border border-green-200"></div>
                    <span className="text-gray-600">Qualified for Final</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-50 border border-yellow-200"></div>
                    <span className="text-gray-600">Play for 3rd Place</span>
                  </div>
                </div>
              )}
            </div>
          );
        } else {
          // Single group display
          const isGroupStageKnockout = tournament.type === 'GROUP_STAGE_KNOCKOUT';
          // Sort by points first, then game difference
          const sortedStandings = [...phase1Standings].sort((a, b) => {
            if ((b.points || 0) !== (a.points || 0)) {
              return (b.points || 0) - (a.points || 0);
            }
            const aGameDiff = (a.gamesWon || 0) - (a.gamesLost || 0);
            const bGameDiff = (b.gamesWon || 0) - (b.gamesLost || 0);
            return bGameDiff - aGameDiff;
          });
          return (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                {isGroupStageKnockout ? 'Phase 1 Classification' : 'Classification'}
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">+/-</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStandings.map((standing, index) => {
                      const gameDiff = (standing.gamesWon || 0) - (standing.gamesLost || 0);
                      const rowClass = isGroupStageKnockout
                        ? (index === 0 ? 'bg-green-50' : index === 1 ? 'bg-yellow-50' : '')
                        : '';

                      return (
                        <tr key={`${standing.player1Id}-${standing.player2Id}`} className={rowClass}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-bold">{index + 1}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                            {standing.player1?.name || 'Player 1'} & {standing.player2?.name || 'Player 2'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-center text-sm">{standing.matchesPlayed || 0}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">{standing.matchesWon || 0}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-center text-sm">{standing.matchesLost || 0}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-bold">{standing.points || 0}</td>
                          <td className={`px-4 py-2 whitespace-nowrap text-center text-sm ${gameDiff > 0 ? 'text-green-600 font-medium' : gameDiff < 0 ? 'text-red-600' : ''}`}>
                            {gameDiff > 0 ? '+' : ''}{gameDiff}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {isGroupStageKnockout && (
                <div className="mt-3 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-green-50 border border-green-200"></div>
                    <span className="text-gray-600">Qualified for Final</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 bg-yellow-50 border border-yellow-200"></div>
                    <span className="text-gray-600">Play for 3rd Place</span>
                  </div>
                </div>
              )}
            </div>
          );
        }
      })()}

      {/* Knockout Bracket Display for KNOCKOUT tournaments */}
      {tournament.type === 'KNOCKOUT' && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tournament Bracket</h2>
          <KnockoutBracket
            matches={tournament.matches || []}
            onMatchClick={isAdmin ? openMatchDialog : undefined}
            tournamentType="KNOCKOUT"
          />
        </div>
      )}

      {/* Matches section for non-KNOCKOUT tournaments */}
      {tournament.type !== 'KNOCKOUT' && (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Matches</h2>

        {(() => {
          // Check if we have multi-group tournament (either ROUND_ROBIN or GROUP_STAGE_KNOCKOUT Phase 1)
          const multiGroup = hasMultipleGroups() && (tournament.type === 'ROUND_ROBIN' || tournament.type === 'GROUP_STAGE_KNOCKOUT');

          if (multiGroup) {
            // Get unique matchdays and groups for Phase 1
            const matchdays = new Set<number>();
            const groups = new Set<number>();
            tournament.matches?.forEach(m => {
              // For GROUP_STAGE_KNOCKOUT, only consider Phase 1 matches
              if (tournament.type === 'GROUP_STAGE_KNOCKOUT' && m.phase !== 1) return;

              if (m.matchDay) matchdays.add(m.matchDay);
              if (m.groupNumber) groups.add(m.groupNumber);
            });
            const sortedMatchdays = Array.from(matchdays).sort((a, b) => a - b);
            const sortedGroups = Array.from(groups).sort((a, b) => a - b);

            // Display Phase 1 matches by matchday, with groups side by side
            const phase1MatchdayDisplay = sortedMatchdays.map(matchday => {
              const matchdayKey = `Matchday ${matchday}`;
              const isExpanded = expandedGroups[matchdayKey] !== false;

              return (
                <div key={matchdayKey} className="mb-6">
                  <div
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleGroup(matchdayKey)}
                  >
                    <h3 className="text-md font-medium text-gray-700">{matchdayKey}</h3>
                    <button className="text-gray-500 hover:text-gray-700">
                      {isExpanded ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className={`mt-3 grid gap-4 ${sortedGroups.length === 2 ? 'grid-cols-1 md:grid-cols-2' : sortedGroups.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                      {sortedGroups.map(groupNum => {
                        const groupMatches = tournament.matches?.filter(m => {
                          // For GROUP_STAGE_KNOCKOUT, only show Phase 1 matches
                          if (tournament.type === 'GROUP_STAGE_KNOCKOUT' && m.phase !== 1) return false;
                          return m.matchDay === matchday && m.groupNumber === groupNum;
                        }) || [];

                        return (
                          <div key={groupNum} className="border rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Group {groupNum}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {groupMatches.map((match) => (
                                <div
                                  key={match.id}
                                  className="border rounded-lg p-3 hover:shadow-md transition-shadow bg-white"
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-medium">Match {match.matchNumber}</span>
                                      {match.status === 'COMPLETED' && (
                                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                                          ✓
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex items-center justify-between">
                                        <span className="truncate">
                                          {match.player1?.name} & {match.player2?.name}
                                        </span>
                                        {match.set1Team1 !== null && (
                                          <span className="font-bold ml-2">
                                            {match.winnerTeam === 1 && '🏆'} {match.set1Team1}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="truncate">
                                          {match.player3?.name} & {match.player4?.name}
                                        </span>
                                        {match.set1Team2 !== null && (
                                          <span className="font-bold ml-2">
                                            {match.winnerTeam === 2 && '🏆'} {match.set1Team2}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {isAdmin && (
                                      <button
                                        onClick={() => openMatchDialog(match)}
                                        className="w-full px-3 py-1.5 text-xs font-medium text-white bg-primary rounded hover:bg-primary-dark"
                                      >
                                        {match.status === 'COMPLETED' ? 'Edit' : 'Enter Result'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });

            // For GROUP_STAGE_KNOCKOUT, also display Phase 2 playoffs after Phase 1 using bracket component
            if (tournament.type === 'GROUP_STAGE_KNOCKOUT') {
              const phase2Matches = tournament.matches?.filter(m => m.phase === 2) || [];

              if (phase2Matches.length > 0) {
                const phase2Display = (
                  <div key="Phase 2" id="phase-2-section" className="mb-6 scroll-mt-4">
                    <KnockoutBracket
                      matches={phase2Matches}
                      onMatchClick={isAdmin ? openMatchDialog : undefined}
                      tournamentType="GROUP_STAGE_KNOCKOUT"
                    />
                  </div>
                );
                return [...phase1MatchdayDisplay, phase2Display];
              }
            }

            return phase1MatchdayDisplay;
          } else {
            // Non-multi-group: use original grouped display
            return Object.entries(groupedMatches).map(([group, matches], groupIndex) => {
              const isExpanded = expandedGroups[group] !== false;

              return (
                <div key={group}>
                  <div className="mb-6">
                    <div
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => toggleGroup(group)}
                    >
                      <h3 className="text-md font-medium text-gray-700">{group}</h3>
                      <button className="text-gray-500 hover:text-gray-700">
                        {isExpanded ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className={`grid gap-3 mt-3 ${
                        matches.length === 3
                          ? 'grid-cols-1 md:grid-cols-3'
                          : matches.length >= 4
                            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                            : 'grid-cols-1 md:grid-cols-2'
                      }`}>
                        {matches.map((match) => (
                          <div
                            key={match.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">
                                    {(() => {
                                      // 8-team knockout match labels
                                      if (tournament.type === 'KNOCKOUT' && match.roundNumber === 3) {
                                        if (match.matchNumber === 9) return 'Final (1st/2nd)';
                                        if (match.matchNumber === 10) return '3rd/4th Place';
                                        if (match.matchNumber === 11) return '5th/6th Place';
                                        if (match.matchNumber === 12) return '7th/8th Place';
                                      }
                                      if (tournament.type === 'KNOCKOUT' && match.roundNumber === 2) {
                                        if (match.matchNumber === 5 || match.matchNumber === 6) return `Semi-final ${match.matchNumber - 4}`;
                                        if (match.matchNumber === 7 || match.matchNumber === 8) return `Loser SF ${match.matchNumber - 6}`;
                                      }
                                      if (tournament.type === 'KNOCKOUT' && match.roundNumber === 1) {
                                        const round1Count = tournament.matches?.filter(m => m.roundNumber === 1).length || 0;
                                        if (round1Count === 4) return `QF ${match.matchNumber}`;
                                        return `SF ${match.matchNumber}`;
                                      }
                                      // 4-team knockout finals
                                      if ((tournament.type === 'KNOCKOUT' || tournament.type === 'GROUP_STAGE_KNOCKOUT') &&
                                          (match.roundNumber === 2 || match.phase === 2)) {
                                        if (match.matchNumber === 1 || match.matchNumber === 3) return 'Final';
                                        if (match.matchNumber === 2 || match.matchNumber === 4) return '3/4 Lugar';
                                      }
                                      return `Match ${match.matchNumber}`;
                                    })()}
                                  </span>
                                  {match.status === 'COMPLETED' && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                      Completed
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span>
                                      <span className="font-medium">Team 1:</span>{' '}
                                      {match.player1?.name} & {match.player2?.name}
                                    </span>
                                    {match.set1Team1 !== null && (
                                      <span className="font-bold text-lg ml-4 flex items-center gap-1">
                                        {match.winnerTeam === 1 && '🏆 '}
                                        {match.set1Team1}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>
                                      <span className="font-medium">Team 2:</span>{' '}
                                      {match.player3?.name} & {match.player4?.name}
                                    </span>
                                    {match.set1Team2 !== null && (
                                      <span className="font-bold text-lg ml-4 flex items-center gap-1">
                                        {match.winnerTeam === 2 && '🏆 '}
                                        {match.set1Team2}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {isAdmin && (
                              <button
                                onClick={() => openMatchDialog(match)}
                                className="ml-4 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark"
                              >
                                {match.status === 'COMPLETED' ? 'Edit Result' : 'Enter Result'}
                              </button>
                            )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Show Phase 1 Classification after ALL Phase 1 matches and before Phase 2 */}
                  {tournament.type === 'GROUP_STAGE_KNOCKOUT' &&
                   group.includes('Phase 1') &&
                   phase1Standings.length > 0 &&
                   Object.keys(groupedMatches).some(k => k.includes('Phase 2')) &&
                   groupIndex === Object.entries(groupedMatches).filter(([k]) => k.includes('Phase 1')).length - 1 && (() => {
                    const groupNumbers = getGroupNumbers();
                    const multiGroup = groupNumbers.length > 1;

                    if (multiGroup) {
                      // Multi-group display: show groups side by side
                      return (
                        <div className="bg-white shadow rounded-lg p-6 my-6">
                          <h2 className="text-lg font-medium text-gray-900 mb-4">Phase 1 Classification by Group</h2>
                          <div className={`grid gap-6 ${groupNumbers.length === 2 ? 'grid-cols-1 md:grid-cols-2' : groupNumbers.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
                            {groupNumbers.map(groupNum => {
                              const groupStandings = phase1Standings
                                .filter(s => s.groupNumber === groupNum)
                                .sort((a, b) => {
                                  if ((b.points || 0) !== (a.points || 0)) {
                                    return (b.points || 0) - (a.points || 0);
                                  }
                                  const aGameDiff = (a.gamesWon || 0) - (a.gamesLost || 0);
                                  const bGameDiff = (b.gamesWon || 0) - (b.gamesLost || 0);
                                  return bGameDiff - aGameDiff;
                                });

                              return (
                                <div key={groupNum} className="border rounded-lg p-4">
                                  <h3 className="text-md font-semibold text-gray-800 mb-3">Group {groupNum}</h3>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-50">
                                        <tr>
                                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                                          <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                                          <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">+/-</th>
                                        </tr>
                                      </thead>
                                      <tbody className="bg-white divide-y divide-gray-200">
                                        {groupStandings.map((standing, index) => {
                                          const gameDiff = (standing.gamesWon || 0) - (standing.gamesLost || 0);
                                          const isQualified = index < 2;

                                          return (
                                            <tr key={`${standing.player1Id}-${standing.player2Id}`} className={isQualified ? 'bg-green-50' : 'bg-yellow-50'}>
                                              <td className="px-2 py-2 whitespace-nowrap text-xs font-bold">{index + 1}</td>
                                              <td className="px-2 py-2 whitespace-nowrap text-xs">
                                                {standing.player1?.name || 'Player 1'} & {standing.player2?.name || 'Player 2'}
                                              </td>
                                              <td className="px-2 py-2 whitespace-nowrap text-center text-xs">{standing.matchesPlayed || 0}</td>
                                              <td className="px-2 py-2 whitespace-nowrap text-center text-xs font-medium">{standing.matchesWon || 0}</td>
                                              <td className="px-2 py-2 whitespace-nowrap text-center text-xs">{standing.matchesLost || 0}</td>
                                              <td className="px-2 py-2 whitespace-nowrap text-center text-xs font-bold">{standing.points || 0}</td>
                                              <td className={`px-2 py-2 whitespace-nowrap text-center text-xs ${gameDiff > 0 ? 'text-green-600 font-medium' : gameDiff < 0 ? 'text-red-600' : ''}`}>
                                                {gameDiff > 0 ? '+' : ''}{gameDiff}
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-green-50 border border-green-200"></div>
                              <span className="text-gray-600">Qualified for Final</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200"></div>
                              <span className="text-gray-600">Play for 3rd Place</span>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // Single group display - sort by points first, then game difference
                      const sortedStandings = [...phase1Standings].sort((a, b) => {
                        if ((b.points || 0) !== (a.points || 0)) {
                          return (b.points || 0) - (a.points || 0);
                        }
                        const aGameDiff = (a.gamesWon || 0) - (a.gamesLost || 0);
                        const bGameDiff = (b.gamesWon || 0) - (b.gamesLost || 0);
                        return bGameDiff - aGameDiff;
                      });
                      return (
                        <div className="bg-white shadow rounded-lg p-6 my-6">
                          <h2 className="text-lg font-medium text-gray-900 mb-4">Phase 1 Classification</h2>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">+/-</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {sortedStandings.map((standing, index) => {
                                  const gameDiff = (standing.gamesWon || 0) - (standing.gamesLost || 0);
                                  const isQualified = index < 2;

                                  return (
                                    <tr key={`${standing.player1Id}-${standing.player2Id}`} className={isQualified ? 'bg-green-50' : 'bg-yellow-50'}>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold">{index + 1}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        {standing.player1?.name || 'Player 1'} & {standing.player2?.name || 'Player 2'}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">{standing.matchesPlayed || 0}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-medium">{standing.matchesWon || 0}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm">{standing.matchesLost || 0}</td>
                                      <td className="px-4 py-2 whitespace-nowrap text-center text-sm font-bold">{standing.points || 0}</td>
                                      <td className={`px-4 py-2 whitespace-nowrap text-center text-sm ${gameDiff > 0 ? 'text-green-600 font-medium' : gameDiff < 0 ? 'text-red-600' : ''}`}>
                                        {gameDiff > 0 ? '+' : ''}{gameDiff}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3 flex gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-green-50 border border-green-200"></div>
                              <span className="text-gray-600">Qualified for Final</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-4 h-4 bg-yellow-50 border border-yellow-200"></div>
                              <span className="text-gray-600">Play for 3rd Place</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              );
            });
          }
        })()}
      </div>
      )}

      <MatchResultModal
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onSubmit={handleSubmitResult}
        match={selectedMatch}
        isLoading={submitResultMutation.isPending}
        allowTies={tournament?.allowTies && selectedMatch?.phase === 1}
      />
    </div>
  );
}
