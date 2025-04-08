import { Schema, model, models } from "mongoose";
import { NoteTypes } from "@/types/Note";

const NoteSchema = new Schema<NoteTypes>({
  title: {
    type: String,
    default: '',
  },
  content: {
    type: Buffer, // 바이너리
    default: Buffer.alloc(0),
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User', // 작성자 참조
    required: true,
  },
  uploadedFiles:{
    type:[String],
    default:[],
  },
  category: {
    _id: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    name: {
      type: String,
      default: '',
    },
  },
  tags: {
    type: [
      {
        id: {
          type: Schema.Types.ObjectId,
          ref: 'Tag',
        },
        name: {
          type: String,
        }
      }
    ],
    default: [],
  },
  mode: {
    type: String,
    enum: ["editor", "text"],
    default: "editor",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  is_locked: {
    type: Boolean,
    default: false,
  },
  is_pinned: {
    type: Boolean,
    default: false,
  },
  is_trashed: {
    type: Boolean,
    default:false,
  },
  trashedAt: {
    type:Date,
    default: null,
  }
}, {
  versionKey: false // __v 필드 비활성화
});

export default models.Note || model<NoteTypes>("Note", NoteSchema);