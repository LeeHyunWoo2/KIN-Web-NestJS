import {Router} from 'express';

import {authRouter} from './auth/authRoutes';
import {userRouter} from './user/userRoutes';
import {socialRouter} from './auth/socialRoutes';
import {noteRouter} from './notes/noteRoutes';
import {categoryRouter} from './notes/categoryRoutes';
import {tagRouter} from './notes/tagRoutes';
import {syncRouter} from './user/syncRoutes';
import {emailRouter} from './auth/emailRoutes';
import {visitorRouter} from './visitor/visitorRoutes';

const router: Router = Router();

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/social', socialRouter);
router.use('/notes', noteRouter);
router.use('/categories', categoryRouter);
router.use('/tags', tagRouter);
router.use('/sync', syncRouter);
router.use('/email', emailRouter);
router.use('/visitor', visitorRouter);

export default router;