import {Router} from 'express';
import {
  getUserInfoController,
  updateUserInfoController,
  addLocalAccountController,
  deleteUserController,
  getUserByInputController,
  getUserPublicProfileController,
  resetPasswordController
} from '../../controllers/user/userController';
import {injectAuthenticatedUser} from '../../middleware/auth/injectAuthenticatedUser';

const userRouter: Router = Router();

userRouter.get('/', injectAuthenticatedUser, getUserPublicProfileController)

userRouter.post('/', injectAuthenticatedUser, getUserInfoController);

// 아이디/비밀번호 찾기 & 이메일 중복체크
userRouter.post('/find', getUserByInputController);

userRouter.put('/', injectAuthenticatedUser, updateUserInfoController);

userRouter.put('/password', resetPasswordController);

// 소셜 계정 -> 일반 계정 전환
userRouter.post('/change-local', injectAuthenticatedUser, addLocalAccountController);

userRouter.delete('/', injectAuthenticatedUser, deleteUserController);

export {userRouter}