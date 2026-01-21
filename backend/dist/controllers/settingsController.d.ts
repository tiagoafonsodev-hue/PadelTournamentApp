import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
/**
 * Get all point configurations for the current user
 */
export declare const getPointConfigurations: (req: AuthRequest, res: Response) => Promise<void>;
/**
 * Get point configuration for a specific category
 */
export declare const getPointConfiguration: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Save point configuration for a category
 */
export declare const savePointConfiguration: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=settingsController.d.ts.map