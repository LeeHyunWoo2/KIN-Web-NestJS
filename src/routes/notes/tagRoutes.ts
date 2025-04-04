import {Router} from 'express';
import {injectAuthenticatedUser} from "../../middleware/auth/injectAuthenticatedUser";
import {
  getTags,
  createTag,
  updateTag,
  deleteTag
} from "../../controllers/notes/tagController";

const tagRouter: Router = Router();

tagRouter.get('/', injectAuthenticatedUser, getTags);

tagRouter.post('/', injectAuthenticatedUser, createTag);

tagRouter.put('/:tagId', injectAuthenticatedUser, updateTag);

tagRouter.delete('/:tagId', injectAuthenticatedUser, deleteTag);

export {tagRouter};