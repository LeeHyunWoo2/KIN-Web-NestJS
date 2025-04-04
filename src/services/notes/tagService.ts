import Tag from '../../models/tag';
import Note from '../../models/note';

exports.createTag = async (user_id, name) => await Tag.create({ name, user_id });

exports.getTags = async (user_id) => 
   Tag.find({ user_id }).select('name') // mongoose는 select를 쓰면 _id를 함께 반환하기 때문에 name만 명시
;

exports.updateTag = async (user_id, tagId, name) => Tag.findOneAndUpdate(
      {_id: tagId, user_id},
      {name},
      {new: true}
  );

exports.deleteTag = async (user_id, tagId, noteIds) => {
  const tag = await Tag.findOneAndDelete({ _id: tagId, user_id });
  if (!tag) {
    throw new Error('태그를 찾을 수 없습니다.');
  }

  // 해당 태그가 사용된 노트에 반영
  if (noteIds && noteIds.length > 0) {
    await Note.updateMany(
        { _id: { $in: noteIds }, user_id },
        { $pull: { tags: { _id: tagId } } }
    );
  }

  return { tagId, updatedNotes: noteIds || [] };
};
