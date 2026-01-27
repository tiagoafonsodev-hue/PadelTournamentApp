'use client';

import { Match } from '@/types';

interface KnockoutBracketProps {
  matches: Match[];
  onMatchClick?: (match: Match) => void;
  tournamentType: 'KNOCKOUT' | 'GROUP_STAGE_KNOCKOUT';
}

interface MatchCardProps {
  match: Match | null;
  label: string;
  onMatchClick?: (match: Match) => void;
  isCompact?: boolean;
}

const MatchCard = ({ match, label, onMatchClick, isCompact = false }: MatchCardProps) => {
  if (!match) {
    return (
      <div className={`border-2 border-dashed border-gray-300 rounded-lg ${isCompact ? 'p-2' : 'p-3'} bg-gray-50`}>
        <div className="text-xs text-gray-400 mb-1">{label}</div>
        <div className="text-sm text-gray-400 italic">TBD</div>
      </div>
    );
  }

  const isCompleted = match.status === 'COMPLETED';
  const team1Won = match.winnerTeam === 1;
  const team2Won = match.winnerTeam === 2;
  const isClickable = !!onMatchClick;

  return (
    <div
      onClick={() => onMatchClick && onMatchClick(match)}
      className={`border rounded-lg ${isCompact ? 'p-2' : 'p-3'} ${isClickable ? 'cursor-pointer hover:shadow-md' : ''} transition-all ${
        isCompleted ? 'bg-white border-green-300' : `bg-white border-gray-300 ${isClickable ? 'hover:border-primary' : ''}`
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {isCompleted && (
          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Done</span>
        )}
      </div>

      {/* Team 1 */}
      <div className={`flex items-center justify-between ${isCompact ? 'text-xs' : 'text-sm'} py-1 px-2 rounded ${
        team1Won ? 'bg-green-50 font-semibold' : ''
      }`}>
        <span className="truncate flex-1">
          {match.player1?.name?.split(' ')[0]} & {match.player2?.name?.split(' ')[0]}
        </span>
        {isCompleted && (
          <span className={`ml-2 font-bold ${team1Won ? 'text-green-600' : 'text-gray-500'}`}>
            {match.set1Team1}
          </span>
        )}
      </div>

      {/* Team 2 */}
      <div className={`flex items-center justify-between ${isCompact ? 'text-xs' : 'text-sm'} py-1 px-2 rounded ${
        team2Won ? 'bg-green-50 font-semibold' : ''
      }`}>
        <span className="truncate flex-1">
          {match.player3?.name?.split(' ')[0]} & {match.player4?.name?.split(' ')[0]}
        </span>
        {isCompleted && (
          <span className={`ml-2 font-bold ${team2Won ? 'text-green-600' : 'text-gray-500'}`}>
            {match.set1Team2}
          </span>
        )}
      </div>
    </div>
  );
};

// Connector line component
const Connector = ({ direction }: { direction: 'right' | 'down' | 'up-right' | 'down-right' }) => {
  if (direction === 'right') {
    return (
      <div className="flex items-center justify-center w-8">
        <div className="w-full h-0.5 bg-gray-300"></div>
      </div>
    );
  }
  return null;
};

export const KnockoutBracket = ({ matches, onMatchClick, tournamentType }: KnockoutBracketProps) => {
  const round1Matches = matches.filter(m => m.roundNumber === 1 && m.phase === 1);
  const round2Matches = matches.filter(m => m.roundNumber === 2 && m.phase === 1);
  const round3Matches = matches.filter(m => m.roundNumber === 3 && m.phase === 1);

  const is8Team = round1Matches.length === 4;

  // For GROUP_STAGE_KNOCKOUT, handle phase 2 matches
  const phase2Round1 = matches.filter(m => m.phase === 2 && m.roundNumber === 1);
  const phase2Round2 = matches.filter(m => m.phase === 2 && m.roundNumber === 2);

  if (tournamentType === 'GROUP_STAGE_KNOCKOUT' && matches.some(m => m.phase === 2)) {
    // GROUP_STAGE_KNOCKOUT Phase 2 bracket
    const has12TeamPlayoff = phase2Round1.length === 6;  // Masters: 6 SF matches
    const has8TeamPlayoff = phase2Round1.length === 4;   // Open1000: 4 SF matches

    // Masters format: 3 brackets (Winners, Middle, Consolation)
    if (has12TeamPlayoff) {
      // Round 1 - Semi-finals (6 matches)
      const winnersSf1 = phase2Round1.find(m => m.matchNumber === 1);
      const winnersSf2 = phase2Round1.find(m => m.matchNumber === 2);
      const middleSf1 = phase2Round1.find(m => m.matchNumber === 3);
      const middleSf2 = phase2Round1.find(m => m.matchNumber === 4);
      const consolationSf1 = phase2Round1.find(m => m.matchNumber === 5);
      const consolationSf2 = phase2Round1.find(m => m.matchNumber === 6);

      // Round 2 - Finals (6 matches)
      const final = phase2Round2.find(m => m.matchNumber === 7);
      const thirdPlace = phase2Round2.find(m => m.matchNumber === 8);
      const fifthPlace = phase2Round2.find(m => m.matchNumber === 9);
      const seventhPlace = phase2Round2.find(m => m.matchNumber === 10);
      const ninthPlace = phase2Round2.find(m => m.matchNumber === 11);
      const eleventhPlace = phase2Round2.find(m => m.matchNumber === 12);

      return (
        <div className="space-y-8" id="phase-2-section">
          {/* Winners Bracket */}
          <div className="bg-gradient-to-r from-green-50 to-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Winners Bracket (1st-4th)
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max items-start">
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={winnersSf1 || null} label="SF 1" onMatchClick={onMatchClick} />
                    <MatchCard match={winnersSf2 || null} label="SF 2" onMatchClick={onMatchClick} />
                  </div>
                </div>
                <div className="flex flex-col justify-center h-full pt-12">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={final || null} label="Final (1st/2nd)" onMatchClick={onMatchClick} />
                    <MatchCard match={thirdPlace || null} label="3rd/4th Place" onMatchClick={onMatchClick} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Bracket */}
          <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Middle Bracket (5th-8th)
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max items-start">
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={middleSf1 || null} label="SF 1" onMatchClick={onMatchClick} />
                    <MatchCard match={middleSf2 || null} label="SF 2" onMatchClick={onMatchClick} />
                  </div>
                </div>
                <div className="flex flex-col justify-center h-full pt-12">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={fifthPlace || null} label="5th/6th Place" onMatchClick={onMatchClick} />
                    <MatchCard match={seventhPlace || null} label="7th/8th Place" onMatchClick={onMatchClick} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consolation Bracket */}
          <div className="bg-gradient-to-r from-orange-50 to-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              Consolation Bracket (9th-12th)
            </h3>
            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max items-start">
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={consolationSf1 || null} label="SF 1" onMatchClick={onMatchClick} />
                    <MatchCard match={consolationSf2 || null} label="SF 2" onMatchClick={onMatchClick} />
                  </div>
                </div>
                <div className="flex flex-col justify-center h-full pt-12">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={ninthPlace || null} label="9th/10th Place" onMatchClick={onMatchClick} />
                    <MatchCard match={eleventhPlace || null} label="11th/12th Place" onMatchClick={onMatchClick} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Open1000 format: 2 brackets (Winners, Consolation)
    if (has8TeamPlayoff) {
      // Round 1 - Semi-finals: Top bracket (1A vs 2B, 2A vs 1B) + Consolation (3A vs 4B, 3B vs 4A)
      const sf1 = phase2Round1.find(m => m.matchNumber === 1);  // 1A vs 2B
      const sf2 = phase2Round1.find(m => m.matchNumber === 2);  // 2A vs 1B
      const consolationSf1 = phase2Round1.find(m => m.matchNumber === 3);  // 3A vs 4B
      const consolationSf2 = phase2Round1.find(m => m.matchNumber === 4);  // 3B vs 4A

      // Round 2 - Finals
      const final = phase2Round2.find(m => m.matchNumber === 5);
      const thirdPlace = phase2Round2.find(m => m.matchNumber === 6);
      const fifthPlace = phase2Round2.find(m => m.matchNumber === 7);
      const seventhPlace = phase2Round2.find(m => m.matchNumber === 8);

      return (
        <div className="space-y-8" id="phase-2-section">
          {/* Winners Bracket */}
          <div className="bg-gradient-to-r from-green-50 to-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              Winners Bracket (1st-4th)
            </h3>

            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max items-start">
                {/* Semi-finals */}
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={sf1 || null} label="SF 1 (1A vs 2B)" onMatchClick={onMatchClick} />
                    <MatchCard match={sf2 || null} label="SF 2 (2A vs 1B)" onMatchClick={onMatchClick} />
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col justify-center h-full pt-12">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Finals */}
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={final || null} label="Final (1st/2nd)" onMatchClick={onMatchClick} />
                    <MatchCard match={thirdPlace || null} label="3rd/4th Place" onMatchClick={onMatchClick} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Consolation Bracket */}
          <div className="bg-gradient-to-r from-orange-50 to-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span>
              Consolation Bracket (5th-8th)
            </h3>

            <div className="overflow-x-auto">
              <div className="flex gap-6 min-w-max items-start">
                {/* Semi-finals */}
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={consolationSf1 || null} label="SF 1 (3A vs 4B)" onMatchClick={onMatchClick} />
                    <MatchCard match={consolationSf2 || null} label="SF 2 (3B vs 4A)" onMatchClick={onMatchClick} />
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col justify-center h-full pt-12">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Placement Finals */}
                <div className="w-52">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Placement Finals</h4>
                  <div className="space-y-3">
                    <MatchCard match={fifthPlace || null} label="5th/6th Place" onMatchClick={onMatchClick} />
                    <MatchCard match={seventhPlace || null} label="7th/8th Place" onMatchClick={onMatchClick} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 4-team playoff structure (semi-finals + finals)
    const semiFinals = phase2Round1.filter(m => m.matchNumber <= 2);
    const finals = phase2Round2.length > 0 ? phase2Round2 : phase2Round1.filter(m => m.matchNumber > 2);

    return (
      <div className="bg-gradient-to-r from-green-50 to-white rounded-lg shadow p-6" id="phase-2-section">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          Phase 2 - Playoffs
        </h3>

        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-max items-center">
            {/* Semi-finals */}
            {semiFinals.length > 0 && (
              <div className="w-56">
                <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
                <div className="space-y-4">
                  {semiFinals.map((match, idx) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      label={`SF ${idx + 1}`}
                      onMatchClick={onMatchClick}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Arrow */}
            {semiFinals.length > 0 && finals.length > 0 && (
              <div className="flex items-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )}

            {/* Finals */}
            <div className="w-56">
              <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Finals</h4>
              <div className="space-y-4">
                {finals.map((match) => {
                  let label = 'Match';
                  if (match.matchNumber === 3 || match.matchNumber === 5 || match.matchNumber === 1) label = 'Final (1st/2nd)';
                  else if (match.matchNumber === 4 || match.matchNumber === 6 || match.matchNumber === 2) label = '3rd/4th Place';

                  return (
                    <MatchCard
                      key={match.id}
                      match={match}
                      label={label}
                      onMatchClick={onMatchClick}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8-team KNOCKOUT bracket
  if (is8Team) {
    const qf1 = round1Matches.find(m => m.matchNumber === 1);
    const qf2 = round1Matches.find(m => m.matchNumber === 2);
    const qf3 = round1Matches.find(m => m.matchNumber === 3);
    const qf4 = round1Matches.find(m => m.matchNumber === 4);

    const sf1 = round2Matches.find(m => m.matchNumber === 5);
    const sf2 = round2Matches.find(m => m.matchNumber === 6);
    const loserSf1 = round2Matches.find(m => m.matchNumber === 7);
    const loserSf2 = round2Matches.find(m => m.matchNumber === 8);

    const final = round3Matches.find(m => m.matchNumber === 9);
    const thirdPlace = round3Matches.find(m => m.matchNumber === 10);
    const fifthPlace = round3Matches.find(m => m.matchNumber === 11);
    const seventhPlace = round3Matches.find(m => m.matchNumber === 12);

    return (
      <div className="space-y-8">
        {/* Winners Bracket */}
        <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Winners Bracket
          </h3>

          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max items-start">
              {/* Quarter-finals */}
              <div className="w-48">
                <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Quarter-finals</h4>
                <div className="space-y-3">
                  <MatchCard match={qf1 || null} label="QF 1" onMatchClick={onMatchClick} isCompact />
                  <MatchCard match={qf2 || null} label="QF 2" onMatchClick={onMatchClick} isCompact />
                  <div className="border-t border-gray-200 my-2"></div>
                  <MatchCard match={qf3 || null} label="QF 3" onMatchClick={onMatchClick} isCompact />
                  <MatchCard match={qf4 || null} label="QF 4" onMatchClick={onMatchClick} isCompact />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col justify-center h-full pt-8">
                <svg className="w-6 h-6 text-gray-400 mb-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Semi-finals */}
              <div className="w-48">
                <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
                <div className="space-y-3">
                  <div className="pt-6">
                    <MatchCard match={sf1 || null} label="SF 1" onMatchClick={onMatchClick} isCompact />
                  </div>
                  <div className="pt-12">
                    <MatchCard match={sf2 || null} label="SF 2" onMatchClick={onMatchClick} isCompact />
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col justify-center h-full pt-16">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Finals */}
              <div className="w-52">
                <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Finals</h4>
                <div className="space-y-3">
                  <div className="pt-10">
                    <MatchCard match={final || null} label="Final (1st/2nd)" onMatchClick={onMatchClick} />
                  </div>
                  <div className="pt-4">
                    <MatchCard match={thirdPlace || null} label="3rd/4th Place" onMatchClick={onMatchClick} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Losers Bracket */}
        <div className="bg-gradient-to-r from-orange-50 to-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            Consolation Bracket (5th-8th)
          </h3>

          <div className="overflow-x-auto">
            <div className="flex gap-4 min-w-max items-start">
              {/* Loser Semi-finals */}
              <div className="w-48">
                <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Loser Semi-finals</h4>
                <div className="space-y-3">
                  <MatchCard match={loserSf1 || null} label="Loser SF 1" onMatchClick={onMatchClick} isCompact />
                  <MatchCard match={loserSf2 || null} label="Loser SF 2" onMatchClick={onMatchClick} isCompact />
                </div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col justify-center h-full pt-8">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Placement Finals */}
              <div className="w-52">
                <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Placement Finals</h4>
                <div className="space-y-3">
                  <MatchCard match={fifthPlace || null} label="5th/6th Place" onMatchClick={onMatchClick} />
                  <MatchCard match={seventhPlace || null} label="7th/8th Place" onMatchClick={onMatchClick} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4-team KNOCKOUT bracket
  const sf1 = round1Matches.find(m => m.matchNumber === 1);
  const sf2 = round1Matches.find(m => m.matchNumber === 2);
  const final = round2Matches.find(m => m.matchNumber === 3);
  const thirdPlace = round2Matches.find(m => m.matchNumber === 4);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
        Knockout Bracket
      </h3>

      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max items-center">
          {/* Semi-finals */}
          <div className="w-56">
            <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Semi-finals</h4>
            <div className="space-y-4">
              <MatchCard match={sf1 || null} label="SF 1" onMatchClick={onMatchClick} />
              <MatchCard match={sf2 || null} label="SF 2" onMatchClick={onMatchClick} />
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Finals */}
          <div className="w-56">
            <h4 className="text-sm font-medium text-gray-600 mb-3 text-center">Finals</h4>
            <div className="space-y-4">
              <MatchCard match={final || null} label="Final (1st/2nd)" onMatchClick={onMatchClick} />
              <MatchCard match={thirdPlace || null} label="3rd/4th Place" onMatchClick={onMatchClick} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnockoutBracket;
