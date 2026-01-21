"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitMatchResult = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const MatchResultService_1 = require("../services/MatchResultService");
const prisma = new client_1.PrismaClient();
const matchResultSchema = zod_1.z.object({
    team1Score: zod_1.z.number().min(0),
    team2Score: zod_1.z.number().min(0),
});
const submitMatchResult = async (req, res) => {
    try {
        const { id } = req.params;
        const data = matchResultSchema.parse(req.body);
        // Verify match belongs to user's tournament
        const match = await prisma.match.findFirst({
            where: { id },
            include: { tournament: true },
        });
        if (!match || match.tournament.userId !== req.userId) {
            return res.status(404).json({ error: 'Match not found' });
        }
        await MatchResultService_1.matchResultService.submitMatchResult(id, data);
        const updatedMatch = await prisma.match.findUnique({
            where: { id },
            include: {
                player1: true,
                player2: true,
                player3: true,
                player4: true,
            },
        });
        res.json(updatedMatch);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        if (error.message) {
            return res.status(400).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
exports.submitMatchResult = submitMatchResult;
//# sourceMappingURL=matchController.js.map