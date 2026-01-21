"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const settingsController_1 = require("../controllers/settingsController");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// Get all point configurations
router.get('/points', settingsController_1.getPointConfigurations);
// Get point configuration for a specific category
router.get('/points/:category', settingsController_1.getPointConfiguration);
// Save point configuration for a category
router.post('/points', settingsController_1.savePointConfiguration);
exports.default = router;
//# sourceMappingURL=settingsRoutes.js.map