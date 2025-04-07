import Category from '../../models/category';
import Note from "../../models/note";
import {CategoryTypes, DeleteCategoryResult} from "@/types/Category";
import {createHttpError} from "@/utils/createHttpError";

export const getCategories = async (userId: string): Promise<CategoryTypes[]> =>
    Category.find({user_id: userId}).lean<CategoryTypes[]>();

export const createCategory = async (
    userId: string,
    name: string,
    parentId?: string
): Promise<CategoryTypes> => {
  if (parentId) {
    const parentCategory = await Category.findOne({ _id: parentId, user_id: userId });
    if (!parentCategory) {
      throw createHttpError(400, '상위 카테고리를 찾을 수 없습니다.')
    }
  }
  const category = new Category({ user_id: userId, name, parent_id: parentId });
  return await category.save();
};

export const updateCategory = async (
    categoryId: string,
    name: string,
    parentId?: string
): Promise<CategoryTypes> => {
  const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      {name, parent_id: parentId},
      {new: true}
  );
  if (!updatedCategory) {
    throw createHttpError(404, '카테고리를 찾을 수 없습니다.')
  }
  return updatedCategory
}

export const deleteCategoriesWithNotes = async (
    categoryIds: string[],
    noteIds: string[]
): Promise<DeleteCategoryResult> => {
  const existingCategories = await Category.find({
    _id: { $in: categoryIds }
  });

  const existingNotes = await Note.find({
    _id: { $in: noteIds }
  });

  const validCategoryIds = existingCategories.map(cat => cat._id.toString());
  const validNoteIds = existingNotes.map(note => note._id.toString());

  const invalidCategoryIds = categoryIds.filter(id => !validCategoryIds.includes(id));
  const invalidNoteIds = noteIds.filter(id => !validNoteIds.includes(id));

  if (invalidCategoryIds.length > 0 || invalidNoteIds.length > 0) {
    console.warn(
        `[카테고리 삭제] 잘못된 ID 감지 → 카테고리: ${invalidCategoryIds}, 노트: ${invalidNoteIds}`
    );
  }

  await Category.deleteMany({ _id: { $in: validCategoryIds } });
  await Note.deleteMany({ _id: { $in: validNoteIds } });

  return {
    deletedCategoryIds: validCategoryIds,
    deletedNoteIds: validNoteIds,
    invalidCategoryIds,
    invalidNoteIds
  };
};