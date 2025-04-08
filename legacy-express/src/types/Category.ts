import { Types } from "mongoose";

export interface CategoryTypes {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  name: string;
  parent_id?: Types.ObjectId;
}

export interface DeleteCategoryResult {
  deletedCategoryIds: string[];
  deletedNoteIds: string[];
  invalidCategoryIds: string[];
  invalidNoteIds: string[];
}