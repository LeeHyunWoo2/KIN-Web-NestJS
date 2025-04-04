import mongoose from 'mongoose';

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // 태그 소유자 참조
    required: true,
  },
}, {
  versionKey: false // __v 필드 비활성화
});
module.exports = mongoose.model('Tag', TagSchema);