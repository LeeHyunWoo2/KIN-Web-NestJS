import {Request, Response} from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategoriesWithNotes
} from '@/services/notes/categoryService';
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";
import {
  CreateAndUpdateCategoryRequestDto,
  DeleteCategoryRequestDto
} from "@/types/dto/category/category.request.dto";
import {CategoryResponseDto} from "@/types/dto/category/category.response.dto";
import {logError} from "@/utils/logError";

export const getCategoriesController = async (
    req: Request,
    res: Response<CategoryResponseDto[]>,
): Promise<void> => {
  try {
    const categories = await getCategories(req.user?.id as string);
    res.status(200).json(categories);
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "카테고리 조회 중 오류가 발생했습니다.");
  }
};

export const createCategoryController = async (
    req: Request<{}, {}, CreateAndUpdateCategoryRequestDto>,
    res: Response<CategoryResponseDto>,
): Promise<void> => {
  try {
    const { name, parent_id } = req.body;
    const category = await createCategory(req.user?.id as string, name, parent_id);
    res.status(201).json(category);
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "카테고리 생성 중 오류가 발생했습니다.");
  }
};

export const updateCategoryController = async (
    req: Request<{categoryId: string}, {}, CreateAndUpdateCategoryRequestDto>,
    res: Response<CategoryResponseDto>,
): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { name, parent_id } = req.body;
    const updatedCategory = await updateCategory(categoryId, name, parent_id);
    res.status(200).json(updatedCategory);
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "카테고리 업데이트 중 오류가 발생했습니다.");
  }
};

export const deleteCategoryController = async (
    req: Request<{}, {}, DeleteCategoryRequestDto>,
    res: Response
): Promise<void> => {
  try {
    const { categoryIds, noteIds } = req.body;

    const result = await deleteCategoriesWithNotes(categoryIds, noteIds);

    res.status(200).json(result);
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, '카테고리 삭제 중 오류가 발생했습니다.');
  }
};