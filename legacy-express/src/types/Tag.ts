import { Types } from "mongoose";

export interface TagTypes {
  name: string;
  user_id: Types.ObjectId;
}

export interface GetTagResultTypes {
  _id: Types.ObjectId;
  name: string;
}