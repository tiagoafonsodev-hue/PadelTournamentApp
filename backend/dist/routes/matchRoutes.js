"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const matchController_1 = require("../controllers/matchController");
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.post('/:id/result', matchController_1.submitMatchResult);
exports.default = router;
//# sourceMappingURL=matchRoutes.js.map