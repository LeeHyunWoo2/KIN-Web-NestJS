import Category from '../../models/category';
import mongoose from "mongoose";
import Note from "../../models/note";

exports.getCategories = async (userId) => {
  return Category.find({user_id: userId})
};

exports.createCategory = async (userId, name, parentId) => {
  try {
    if (parentId) {
      const parentCategory = await Category.findOne({ 
        _id: parentId,
        user_id: userId 
      });
      if (!parentCategory) {
        const error = new Error("상위 카테고리를 찾을 수 없습니다.");
        error.status = 400;
        throw error;
      }
    }

    const category = new Category({
      user_id: userId,
      name,
      parent_id: parentId
    });

    return await category.save();
  } catch (error) {
    throw error;
  }
};

exports.updateCategory = async (categoryId, name, parent_id) => {
  return Category.findByIdAndUpdate(
      categoryId,
      {name, parent_id},
      {new: true}
  );
};

exports.deleteCategory = async (categoryIds) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. 삭제 대상 검증
    const existingCategories = await Category.find({ _id: { $in: categoryIds } }).session(session);
    const existingIds = existingCategories.map((cat) => cat._id.toString());

    const invalidIds = categoryIds.filter((id) => !existingIds.includes(id));
    if (invalidIds.length > 0) {
      throw new Error(`유효하지 않은 카테고리 ID: ${invalidIds.join(", ")}`);
    }

    // 2. 카테고리 삭제
    await Category.deleteMany({ _id: { $in: categoryIds } }).session(session);

    // 3. 연결된 노트 삭제
    const deletedNotes = await Note.deleteMany({ category_id: { $in: categoryIds } }).session(session);

    // 4. 트랜잭션 커밋
    await session.commitTransaction();
    await session.endSession();

    return {
      deletedCategoryIds: categoryIds,
      deletedNoteIds: deletedNotes.deletedCount,
    };
  } catch (error) {
    // 트랜잭션 롤백
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};