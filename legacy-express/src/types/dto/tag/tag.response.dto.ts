import { Types } from "mongoose";

export interface TagResponseDto {
  _id: Types.ObjectId;
  name: string;
}