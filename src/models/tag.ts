import { Schema, model, models } from "mongoose";
import { TagTypes } from "@/types/Tag";

const TagSchema = new Schema<TagTypes>({
  name: {
    type: String,
    required: true,
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', // 태그 소유자 참조
    required: true,
  },
}, {
  versionKey: false // __v 필드 비활성화
});

export default models.Tag || model<TagTypes>("Tag", TagSchema);