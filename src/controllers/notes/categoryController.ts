import categoryService from '../../services/notes/categoryService';
import { createErrorResponse } from "../../utils/formatErrorResponse";
import Category from "../../models/category";
import Note from "../../models/note";

export const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getCategories(req.user.id);
    res.status(200).json(categories);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "카테고리 조회 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    const category = await categoryService.createCategory(req.user.id, name, parent_id);
    res.status(201).json(category);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "카테고리 생성 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, parent_id } = req.body;
    const updatedCategory = await categoryService.updateCategory(categoryId, name, parent_id);
    res.status(200).json(updatedCategory);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "카테고리 업데이트 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { categoryIds, noteIds } = req.body;

    const existingCategories = await Category.find({ _id: { $in: categoryIds } });
    const existingNotes = await Note.find({ _id: { $in: noteIds } });

    const validCategoryIds = existingCategories.map((category) => category._id.toString());
    const validNoteIds = existingNotes.map((note) => note._id.toString());

    const invalidCategoryIds = categoryIds.filter((id) => !validCategoryIds.includes(id));
    const invalidNoteIds = noteIds.filter((id) => !validNoteIds.includes(id));

    // TODO : 클라이언트에서 피드백이 되게끔 완성하기
    if (invalidCategoryIds.length > 0 || invalidNoteIds.length > 0) {
      console.warn(`잘못된 ID가 감지되었습니다. 카테고리: ${invalidCategoryIds}, 노트: ${invalidNoteIds}`);
    }

    await Category.deleteMany({ _id: { $in: validCategoryIds } });
    await Note.deleteMany({ _id: { $in: validNoteIds } });

    res.status(200).json({
      deletedCategoryIds: validCategoryIds,
      deletedNoteIds: validNoteIds,
    });
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "카테고리 삭제 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};