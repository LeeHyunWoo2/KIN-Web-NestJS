import {Router} from 'express';
import {
  getNotesController,
  createNoteController,
  updateNotesController,
  deleteNotesController,
} from '@/controllers/notes/noteController';
import {injectAuthenticatedUser} from '@/middleware/auth/injectAuthenticatedUser';

const noteRouter: Router = Router();

noteRouter.get('/', injectAuthenticatedUser, getNotesController);

noteRouter.post('/', injectAuthenticatedUser, createNoteController);

noteRouter.put('/', injectAuthenticatedUser, updateNotesController);

noteRouter.delete('/', injectAuthenticatedUser, deleteNotesController);

export {noteRouter};