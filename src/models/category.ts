import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 사용자 참조
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  parent_id: {
    type: mongoose.Schema.Types.ObjectId, // 상위 카테고리
    ref: 'Category',
    required: false,
  }
}, {
  versionKey: false // __v 필드 비활성화
});
module.exports = mongoose.model('Category', CategorySchema);