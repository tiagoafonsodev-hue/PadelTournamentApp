import { TournamentCategory } from '@prisma/client';
interface PlayerPosition {
    playerId: string;
    position: number;
    matchesWon?: number;
}
export declare class TournamentPointService {
    /**
     * Get points for a specific position in a category
     * First checks user's custom configuration, falls back to defaults
     */
    getPointsForPosition(userId: string, category: TournamentCategory, position: number): Promise<number>;
    /**
     * Award points to all players in a finished tournament
     * Includes bonus points: +1 for each match won in the tournament
     */
    awardTournamentPoints(tournamentId: string, finalPositions: PlayerPosition[]): Promise<void>;
    /**
     * Recalculate total tournament points for a player
     * Useful if point configurations change
     */
    recalculatePlayerPoints(playerId: string): Promise<number>;
    /**
     * Get user's point configuration for a category
     */
    getPointConfiguration(userId: string, category: TournamentCategory): Promise<Record<number, number>>;
    /**
     * Save user's point configuration for a category
     */
    savePointConfiguration(userId: string, category: TournamentCategory, points: Record<number, number>): Promise<void>;
    /**
     * Get all point configurations for a user
     */
    getAllPointConfigurations(userId: string): Promise<Record<TournamentCategory, Record<number, number>>>;
}
export declare const tournamentPointService: TournamentPointService;
export {};
//# sourceMappingURL=TournamentPointService.d.ts.map