import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createPlayer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPlayers: (req: AuthRequest, res: Response) => Promise<void>;
export declare const updatePlayer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deletePlayer: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getLeaderboard: (req: AuthRequest, res: Response) => Promise<void>;
//# sourceMappingURL=playerController.d.ts.map