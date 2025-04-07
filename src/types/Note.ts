import { Types } from "mongoose";

export interface NoteTypes {
  _id: Types.ObjectId;
  title: string;
  content: Buffer;
  user_id: Types.ObjectId;
  uploadedFiles: string[];
  category: {
    _id: Types.ObjectId | null;
    name: string;
  };
  tags: {
    id: Types.ObjectId;
    name: string;
  }[];
  mode: "editor" | "text";
  created_at: Date;
  updated_at: Date;
  is_locked: boolean;
  is_pinned: boolean;
  is_trashed: boolean;
  trashedAt: Date | null;
}