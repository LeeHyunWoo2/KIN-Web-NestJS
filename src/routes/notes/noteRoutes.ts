import {Router} from 'express';
import {
  getNotes,
  createNote,
  updateNotes,
  deleteNotes,
} from '../../controllers/notes/noteController';
import {injectAuthenticatedUser} from '../../middleware/auth/injectAuthenticatedUser';

const noteRouter: Router = Router();

noteRouter.get('/', injectAuthenticatedUser, getNotes);

noteRouter.post('/', injectAuthenticatedUser, createNote);

noteRouter.put('/', injectAuthenticatedUser, updateNotes);

noteRouter.delete('/', injectAuthenticatedUser, deleteNotes);

export {noteRouter};