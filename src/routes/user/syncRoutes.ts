import {Router} from 'express';
import {injectAuthenticatedUser} from '../../middleware/auth/injectAuthenticatedUser';
import {
  updateUserActivityTimeController,
  getLastActivityController,
  syncAllController
} from "../../controllers/user/syncController";

const syncRouter: Router = Router();

syncRouter.put('/', injectAuthenticatedUser, updateUserActivityTimeController);

syncRouter.get('/', injectAuthenticatedUser, getLastActivityController);

// 통합 데이터 요청
syncRouter.get('/all', injectAuthenticatedUser, syncAllController);

export {syncRouter};