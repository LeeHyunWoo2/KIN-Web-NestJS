import {Types} from "mongoose";

export interface CategoryResponseDto {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  name: string;
  parent_id?: Types.ObjectId;
}