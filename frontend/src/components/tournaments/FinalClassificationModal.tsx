'use client';

import { X, Trophy } from 'lucide-react';

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

interface FinalClassificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  standings: TeamStanding[];
  tournamentName: string;
  tournamentType: string;
}

export function FinalClassificationModal({
  isOpen,
  onClose,
  standings,
  tournamentName,
  tournamentType,
}: FinalClassificationModalProps) {
  if (!isOpen) return null;

  // For ROUND_ROBIN, sort by points then game diff
  // For KNOCKOUT/GROUP_STAGE_KNOCKOUT, sort by position
  const sortedStandings = [...standings].sort((a, b) => {
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position;
    }
    if ((b.points || 0) !== (a.points || 0)) {
      return (b.points || 0) - (a.points || 0);
    }
    const aGameDiff = (a.gamesWon || 0) - (a.gamesLost || 0);
    const bGameDiff = (b.gamesWon || 0) - (b.gamesLost || 0);
    return bGameDiff - aGameDiff;
  });

  const isKnockout = tournamentType === 'KNOCKOUT' ||
    (tournamentType === 'GROUP_STAGE_KNOCKOUT' && standings.some(s => s.position !== undefined));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-xl font-bold text-white">Final Classification</h2>
                  <p className="text-yellow-100 text-sm">{tournamentName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-yellow-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Podium for top 3 */}
            <div className="flex justify-center items-end gap-4 mb-8">
              {/* 2nd place */}
              {sortedStandings[1] && (
                <div className="flex flex-col items-center">
                  <div className="text-4xl mb-2">🥈</div>
                  <div className="bg-gray-200 rounded-t-lg px-6 py-4 text-center min-w-[140px]">
                    <div className="font-bold text-gray-800 text-sm">
                      {sortedStandings[1].player1?.name}
                    </div>
                    <div className="font-bold text-gray-800 text-sm">
                      {sortedStandings[1].player2?.name}
                    </div>
                  </div>
                  <div className="bg-gray-300 w-full py-2 text-center font-bold text-gray-700">
                    2nd
                  </div>
                </div>
              )}

              {/* 1st place */}
              {sortedStandings[0] && (
                <div className="flex flex-col items-center -mt-4">
                  <div className="text-5xl mb-2">🥇</div>
                  <div className="bg-yellow-200 rounded-t-lg px-8 py-6 text-center min-w-[160px]">
                    <div className="font-bold text-yellow-800 text-base">
                      {sortedStandings[0].player1?.name}
                    </div>
                    <div className="font-bold text-yellow-800 text-base">
                      {sortedStandings[0].player2?.name}
                    </div>
                  </div>
                  <div className="bg-yellow-400 w-full py-3 text-center font-bold text-yellow-900">
                    1st
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {sortedStandings[2] && (
                <div className="flex flex-col items-center mt-4">
                  <div className="text-4xl mb-2">🥉</div>
                  <div className="bg-orange-200 rounded-t-lg px-6 py-3 text-center min-w-[140px]">
                    <div className="font-bold text-orange-800 text-sm">
                      {sortedStandings[2].player1?.name}
                    </div>
                    <div className="font-bold text-orange-800 text-sm">
                      {sortedStandings[2].player2?.name}
                    </div>
                  </div>
                  <div className="bg-orange-300 w-full py-2 text-center font-bold text-orange-800">
                    3rd
                  </div>
                </div>
              )}
            </div>

            {/* Full standings table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                    {!isKnockout && (
                      <>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">P</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">W</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">L</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pts</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Games</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Base Pts</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bonus</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedStandings.map((standing, index) => {
                    const position = standing.position || index + 1;
                    const basePoints = standing.tournamentPointsAwarded || 0;
                    const bonusPoints = standing.bonusPoints || 0;
                    const totalPoints = basePoints + bonusPoints;
                    const gameDiff = (standing.gamesWon || 0) - (standing.gamesLost || 0);

                    let rowClass = '';
                    let medal = '';
                    if (position === 1) {
                      rowClass = 'bg-yellow-50';
                      medal = '🥇';
                    } else if (position === 2) {
                      rowClass = 'bg-gray-50';
                      medal = '🥈';
                    } else if (position === 3) {
                      rowClass = 'bg-orange-50';
                      medal = '🥉';
                    }

                    return (
                      <tr key={`${standing.player1Id}-${standing.player2Id}`} className={rowClass}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-lg font-bold">{medal} {position}</span>
                          <span className="text-xs text-gray-500 ml-0.5">
                            {position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {standing.player1?.name || 'Player 1'} & {standing.player2?.name || 'Player 2'}
                        </td>
                        {!isKnockout && (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                              {standing.matchesPlayed || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-green-600">
                              {standing.matchesWon || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-red-600">
                              {standing.matchesLost || 0}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-bold">
                              {standing.points || 0}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          <span className="text-gray-600">{standing.gamesWon || 0}-{standing.gamesLost || 0}</span>
                          <span className={`ml-1 text-xs ${gameDiff > 0 ? 'text-green-600' : gameDiff < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            ({gameDiff > 0 ? '+' : ''}{gameDiff})
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
                          {basePoints}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {bonusPoints > 0 ? (
                            <span className="text-green-600 font-medium">+{bonusPoints}</span>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
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

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
