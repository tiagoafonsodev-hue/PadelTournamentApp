"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const playerController_1 = require("../controllers/playerController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.post('/', playerController_1.createPlayer);
router.get('/', playerController_1.getPlayers);
router.put('/:id', playerController_1.updatePlayer);
router.delete('/:id', playerController_1.deletePlayer);
router.get('/leaderboard', playerController_1.getLeaderboard);
exports.default = router;
//# sourceMappingURL=playerRoutes.js.map