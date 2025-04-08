"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const userController_1 = require("@/controllers/user/userController");
const injectAuthenticatedUser_1 = require("@/middleware/auth/injectAuthenticatedUser");
const userRouter = (0, express_1.Router)();
exports.userRouter = userRouter;
userRouter.get('/', injectAuthenticatedUser_1.injectAuthenticatedUser, userController_1.getUserPublicProfileController);
userRouter.post('/', injectAuthenticatedUser_1.injectAuthenticatedUser, userController_1.getUserInfoController);
// 아이디/비밀번호 찾기 & 이메일 중복체크
userRouter.post('/find', userController_1.getUserByInputController);
userRouter.put('/', injectAuthenticatedUser_1.injectAuthenticatedUser, userController_1.updateUserInfoController);
userRouter.put('/password', userController_1.resetPasswordController);
// 소셜 계정 -> 일반 계정 전환
userRouter.post('/change-local', injectAuthenticatedUser_1.injectAuthenticatedUser, userController_1.addLocalAccountController);
userRouter.delete('/', injectAuthenticatedUser_1.injectAuthenticatedUser, userController_1.deleteUserController);
