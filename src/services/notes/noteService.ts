import Note from '../../models/note';
import {NoteTypes} from "@/types/Note";

export const getNotes = async (
    userId: string
    ): Promise<NoteTypes[]> =>
    Note.find({ user_id: userId }).sort({ created_at: -1 }).lean<NoteTypes[]>();

export const createNote = async (
    userId: string,
    title: string,
    content: string,
    category: NoteTypes['category'],
    tags: NoteTypes['tags'],
    mode: NoteTypes['mode']
): Promise<NoteTypes> => {
  const note = new Note({
    user_id: userId,
    title,
    content: Buffer.from(content),
    category,
    tags,
    mode,
  });

  return await note.save();
};

export const updateNote = async (
    filter: {
      _id: string;
      user_id: string
    },
    updates: Partial<Omit<NoteTypes, 'user_id' | 'created_at'>>
): Promise<NoteTypes | null> => {
  if (updates.content) {
    updates.content = Buffer.from(updates.content);
  }

  return Note.findOneAndUpdate(
      filter,
      { ...updates, updated_at: Date.now() },
      { new: true }
  );
};

export const deleteNote = async (
    noteId: string
): Promise<void> => {
  Note.findByIdAndDelete(noteId);
  return;
}
