"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const tournamentController_1 = require("../controllers/tournamentController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.post('/', tournamentController_1.createTournament);
router.get('/', tournamentController_1.getTournaments);
router.get('/:id', tournamentController_1.getTournamentById);
router.get('/:id/standings', tournamentController_1.getTournamentStandings);
router.delete('/:id', tournamentController_1.deleteTournament);
exports.default = router;
//# sourceMappingURL=tournamentRoutes.js.map