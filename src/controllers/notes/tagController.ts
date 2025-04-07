import {
  getTags,
  createTag,
  updateTag,
  deleteTag,
} from '@/services/notes/tagService';
import {Request, Response} from "express";
import {CreateAndUpdateTagRequestDto, DeleteTagRequestDto} from "@/types/dto/tag/tag.request.dto";
import {TagResponseDto} from "@/types/dto/tag/tag.response.dto";
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";

export const createTagController = async (
    req: Request<{}, {}, CreateAndUpdateTagRequestDto>,
    res: Response,
): Promise<void> => {
  try {
    const { name } = req.body;

    const tag = await createTag(req.user?.id as string, name);
    res.status(201).json(tag);
  } catch (error) {
    sendFormattedError(res, error as CustomError, "태그 생성 중 오류가 발생했습니다.");
  }
};

export const getTagsController = async (
    req: Request,
    res: Response<TagResponseDto[]>,
): Promise<void> => {
  try {
    const tags = await getTags(req.user?.id as string);
    res.status(200).json(tags);
  } catch (error) {
    sendFormattedError(res, error as CustomError, "태그 조회 중 오류가 발생했습니다.");
  }
};

export const updateTagController = async (
    req: Request<{ tagId: string }, {}, CreateAndUpdateTagRequestDto>,
    res: Response,
): Promise<void> => {
  try {
    const { tagId } = req.params;
    const { name } = req.body;

    const updatedTag = await updateTag(req.user!.id, tagId, name);

    res.status(200).json(updatedTag);
  } catch (error) {
    sendFormattedError(res, error as CustomError, "태그 수정 중 오류가 발생했습니다.");
  }
};

export const deleteTagController = async (
    req: Request<{tagId:string}, {}, DeleteTagRequestDto>,
    res: Response<{tagId: string; updatedNotes?: string[]}>,
): Promise<void> => {
  try {
    const { tagId } = req.params;
    const { noteIds } = req.body;

    const deletedTag = await deleteTag(req.user!.id, tagId, noteIds);

    res.status(200).json(deletedTag);
  } catch (error) {
    sendFormattedError(res, error as CustomError, "태그 삭제 중 오류가 발생했습니다.");
  }
};