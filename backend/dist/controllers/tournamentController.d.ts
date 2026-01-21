import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createTournament: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTournaments: (req: AuthRequest, res: Response) => Promise<void>;
export declare const getTournamentById: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTournamentStandings: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteTournament: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=tournamentController.d.ts.map