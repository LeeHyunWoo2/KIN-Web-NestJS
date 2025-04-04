import {Router} from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../controllers/notes/categoryController';
import {injectAuthenticatedUser} from '../../middleware/auth/injectAuthenticatedUser';

const categoryRouter: Router = Router();

categoryRouter.get('/', injectAuthenticatedUser, getCategories);

categoryRouter.post('/', injectAuthenticatedUser, createCategory);

categoryRouter.put('/:categoryId', injectAuthenticatedUser, updateCategory);

categoryRouter.delete('/', injectAuthenticatedUser, deleteCategory);

export {categoryRouter};