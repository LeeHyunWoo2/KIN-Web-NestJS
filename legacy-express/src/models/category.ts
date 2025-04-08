import { Schema, model, models } from "mongoose";
import { CategoryTypes } from "@/types/Category";

const CategorySchema = new Schema<CategoryTypes>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', // 사용자 참조
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  parent_id: {
    type: Schema.Types.ObjectId, // 상위 카테고리
    ref: 'Category',
    required: false,
  }
}, {
  versionKey: false // __v 필드 비활성화
});

export default models.Category || model<CategoryTypes>("Category", CategorySchema);