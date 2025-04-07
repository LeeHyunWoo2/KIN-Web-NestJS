import {Router} from 'express';
import {injectAuthenticatedUser} from "@/middleware/auth/injectAuthenticatedUser";
import {
  getTagsController,
  createTagController,
  updateTagController,
  deleteTagController} from "@/controllers/notes/tagController";

const tagRouter: Router = Router();

tagRouter.post('/', injectAuthenticatedUser, createTagController);

tagRouter.get('/', injectAuthenticatedUser, getTagsController);

tagRouter.put('/:tagId', injectAuthenticatedUser, updateTagController);

tagRouter.delete('/:tagId', injectAuthenticatedUser, deleteTagController);

export {tagRouter};