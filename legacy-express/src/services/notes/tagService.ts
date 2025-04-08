import Tag from '../../models/tag';
import Note from '../../models/note';
import {GetTagResultTypes, TagTypes} from "@/types/Tag";
import {createHttpError} from "@/utils/createHttpError";

export const createTag = async (
    user_id: string,
    name: string,
): Promise<TagTypes> => await Tag.create({name, user_id})

export const getTags = async (
    user_id: string
    ): Promise<GetTagResultTypes[]> =>
    Tag.find({user_id}).select('name').lean<GetTagResultTypes[]>()
;

export const updateTag = async (
    user_id: string,
    tagId: string,
    name: string,
): Promise<TagTypes> => {
  const updatedTag =await Tag.findOneAndUpdate(
      {_id: tagId, user_id},
      {name},
      {new: true}
  );
  if(!updatedTag){
    createHttpError(404, '태그를 찾을 수 없습니다.')
  }
  return updatedTag;
}

export const deleteTag = async (
    user_id: string,
    tagId: string,
    noteIds?: string[]
): Promise<{
  tagId: string;
  updatedNotes: string[]
}> => {
  const tag = await Tag.findOneAndDelete({ _id: tagId, user_id });
  if (!tag) {
    throw createHttpError(404, '해당 태그를 찾을 수 없습니다.');
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
