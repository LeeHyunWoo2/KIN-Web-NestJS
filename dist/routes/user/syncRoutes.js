"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncRouter = void 0;
const express_1 = require("express");
const injectAuthenticatedUser_1 = require("@/middleware/auth/injectAuthenticatedUser");
const syncController_1 = require("@/controllers/user/syncController");
const syncRouter = (0, express_1.Router)();
exports.syncRouter = syncRouter;
syncRouter.put('/', injectAuthenticatedUser_1.injectAuthenticatedUser, syncController_1.updateUserActivityTimeController);
syncRouter.get('/', injectAuthenticatedUser_1.injectAuthenticatedUser, syncController_1.getLastActivityController);
// 통합 데이터 요청
syncRouter.get('/all', injectAuthenticatedUser_1.injectAuthenticatedUser, syncController_1.syncAllController);
