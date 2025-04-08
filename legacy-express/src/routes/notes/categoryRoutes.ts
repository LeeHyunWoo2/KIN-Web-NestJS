import {Router} from 'express';
import {
  getCategoriesController,
  createCategoryController,
  updateCategoryController,
  deleteCategoryController
} from '@/controllers/notes/categoryController';
import {injectAuthenticatedUser} from '@/middleware/auth/injectAuthenticatedUser';

const categoryRouter: Router = Router();

categoryRouter.get('/', injectAuthenticatedUser, getCategoriesController);

categoryRouter.post('/', injectAuthenticatedUser, createCategoryController);

categoryRouter.put('/:categoryId', injectAuthenticatedUser, updateCategoryController);

categoryRouter.delete('/', injectAuthenticatedUser, deleteCategoryController);

export {categoryRouter};