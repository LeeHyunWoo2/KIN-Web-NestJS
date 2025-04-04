import tagService from '../../services/notes/tagService';
import { createErrorResponse } from "../../utils/formatErrorResponse";

export const createTag = async (req, res) => {
  try {
    const { name } = req.body;

    const tag = await tagService.createTag(req.user.id, name);
    res.status(201).json(tag);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "태그 생성 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const getTags = async (req, res) => {
  try {
    const tags = await tagService.getTags(req.user.id);
    res.status(200).json(tags);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "태그 조회 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const updateTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { name } = req.body;

    const updatedTag = await tagService.updateTag(req.user.id, tagId, name);
    if (!updatedTag) return res.status(404).json({ message: "해당 태그를 찾을 수 없습니다." });

    res.status(200).json(updatedTag);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "태그 수정 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};

export const deleteTag = async (req, res) => {
  try {
    const { tagId } = req.params;
    const { noteIds } = req.body;

    const deletedTag = await tagService.deleteTag(req.user.id, tagId, noteIds);
    if (!deletedTag) {
      return res.status(404).json({ message: "해당 태그를 찾을 수 없습니다." });
    }
    res.status(200).json(deletedTag);
  } catch (error) {
    const { statusCode, message } = createErrorResponse(error.status || 500, error.message || "태그 삭제 중 오류가 발생했습니다.");
    res.status(statusCode).json({ message });
  }
};