export enum UserRole {
  ADMIN = 'ADMIN',
  PLAYER = 'PLAYER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  playerId?: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Player {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  createdAt: string;
  stats?: PlayerStats;
}

export interface PlayerStats {
  id: string;
  playerId: string;
  totalMatches: number;
  matchesWon: number;
  matchesLost: number;
  matchesDrawn: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
  tournamentsPlayed: number;
  tournamentsWon: number;
  tournamentPoints: number;
  winPercentage: number;
  lastUpdated: string;
}

export enum TournamentType {
  ROUND_ROBIN = 'ROUND_ROBIN',
  KNOCKOUT = 'KNOCKOUT',
  GROUP_STAGE_KNOCKOUT = 'GROUP_STAGE_KNOCKOUT',
}

export enum TournamentStatus {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  PHASE_1_COMPLETE = 'PHASE_1_COMPLETE',
  PHASE_2_COMPLETE = 'PHASE_2_COMPLETE',
  FINISHED = 'FINISHED',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TournamentCategory {
  OPEN_250 = 'OPEN_250',
  OPEN_500 = 'OPEN_500',
  OPEN_1000 = 'OPEN_1000',
  MASTERS = 'MASTERS',
}

export interface Tournament {
  id: string;
  userId: string;
  name: string;
  type: TournamentType;
  category: TournamentCategory;
  status: TournamentStatus;
  currentPhase: number;
  maxPhases: number;
  allowTies: boolean;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  players?: TournamentPlayer[];
  matches?: Match[];
}

export interface TournamentPlayer {
  tournamentId: string;
  playerId: string;
  groupNumber?: number | null;
  player: Player;
}

export interface Match {
  id: string;
  tournamentId: string;
  phase: number;
  roundNumber: number;
  matchNumber: number;
  matchDay?: number | null; // For Round Robin matchday grouping
  player1Id: string;
  player2Id: string;
  player3Id: string;
  player4Id: string;
  team1Score?: number | null;
  team2Score?: number | null;
  set1Team1?: number | null; // Used for game scores (single set)
  set1Team2?: number | null;
  set2Team1?: number | null;
  set2Team2?: number | null;
  set3Team1?: number | null;
  set3Team2?: number | null;
  winnerTeam?: number | null;
  status: MatchStatus;
  groupNumber?: number | null;
  scheduledAt?: string | null;
  playedAt?: string | null;
  player1?: Player;
  player2?: Player;
  player3?: Player;
  player4?: Player;
}

export interface MatchResultInput {
  team1Score: number; // Games won by team 1 (single set)
  team2Score: number; // Games won by team 2 (single set)
}

export interface TournamentPointConfig {
  id: string;
  userId: string;
  category: TournamentCategory;
  position: number;
  points: number;
}

export interface TournamentResult {
  id: string;
  tournamentId: string;
  playerId: string;
  finalPosition: number;
  pointsAwarded: number;
  bonusPoints: number;
  category: TournamentCategory;
  createdAt: string;
  player?: Player;
  tournament?: Tournament;
}
