"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePointConfiguration = exports.getPointConfiguration = exports.getPointConfigurations = void 0;
const zod_1 = require("zod");
const TournamentPointService_1 = require("../services/TournamentPointService");
// Schema for updating point configuration
const pointConfigSchema = zod_1.z.object({
    category: zod_1.z.enum(['OPEN_250', 'OPEN_500', 'OPEN_1000', 'MASTERS']),
    points: zod_1.z.record(zod_1.z.string(), zod_1.z.number().min(0)),
});
/**
 * Get all point configurations for the current user
 */
const getPointConfigurations = async (req, res) => {
    try {
        const configs = await TournamentPointService_1.tournamentPointService.getAllPointConfigurations(req.userId);
        res.json(configs);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getPointConfigurations = getPointConfigurations;
/**
 * Get point configuration for a specific category
 */
const getPointConfiguration = async (req, res) => {
    try {
        const { category } = req.params;
        if (!['OPEN_250', 'OPEN_500', 'OPEN_1000', 'MASTERS'].includes(category)) {
            return res.status(400).json({ error: 'Invalid category' });
        }
        const config = await TournamentPointService_1.tournamentPointService.getPointConfiguration(req.userId, category);
        res.json(config);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getPointConfiguration = getPointConfiguration;
/**
 * Save point configuration for a category
 */
const savePointConfiguration = async (req, res) => {
    try {
        const data = pointConfigSchema.parse(req.body);
        // Convert string keys to numbers
        const points = {};
        for (const [key, value] of Object.entries(data.points)) {
            points[parseInt(key)] = value;
        }
        await TournamentPointService_1.tournamentPointService.savePointConfiguration(req.userId, data.category, points);
        res.json({ message: 'Configuration saved successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.savePointConfiguration = savePointConfiguration;
//# sourceMappingURL=settingsController.js.map