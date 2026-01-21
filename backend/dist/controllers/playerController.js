"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.deletePlayer = exports.updatePlayer = exports.getPlayers = exports.createPlayer = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const playerSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    phoneNumber: zod_1.z.string().optional().or(zod_1.z.literal('')),
});
const createPlayer = async (req, res) => {
    try {
        const data = playerSchema.parse(req.body);
        const player = await prisma.player.create({
            data: {
                userId: req.userId,
                name: data.name,
                email: data.email || null,
                phoneNumber: data.phoneNumber || null,
            },
        });
        // Create initial stats
        await prisma.playerStats.create({
            data: { playerId: player.id },
        });
        res.json(player);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Server error' });
    }
};
exports.createPlayer = createPlayer;
const getPlayers = async (req, res) => {
    try {
        const { search } = req.query;
        const players = await prisma.player.findMany({
            where: {
                userId: req.userId,
                ...(search && {
                    name: { contains: search, mode: 'insensitive' },
                }),
            },
            include: { stats: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(players);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getPlayers = getPlayers;
const updatePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const data = playerSchema.parse(req.body);
        const player = await prisma.player.findFirst({
            where: { id, userId: req.userId },
        });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        const updated = await prisma.player.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email || null,
                phoneNumber: data.phoneNumber || null,
            },
        });
        res.json(updated);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        res.status(500).json({ error: 'Server error' });
    }
};
exports.updatePlayer = updatePlayer;
const deletePlayer = async (req, res) => {
    try {
        const { id } = req.params;
        const player = await prisma.player.findFirst({
            where: { id, userId: req.userId },
        });
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        await prisma.player.delete({ where: { id } });
        res.json({ message: 'Player deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.deletePlayer = deletePlayer;
const getLeaderboard = async (req, res) => {
    try {
        const players = await prisma.player.findMany({
            where: { userId: req.userId },
            include: { stats: true },
            orderBy: {
                stats: {
                    tournamentPoints: 'desc',
                },
            },
        });
        res.json(players);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.getLeaderboard = getLeaderboard;
//# sourceMappingURL=playerController.js.map