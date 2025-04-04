import Note from '../../models/note';

exports.getNotes = async (userId) => Note.find({user_id: userId})
  .sort({created_at: -1});

exports.createNote = async (userId, title, content, category, tags, mode) => {
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

exports.updateNote = async (filter, updates) => {
  if (updates.content) {
    updates.content = Buffer.from(updates.content);
  }
  return Note.findOneAndUpdate(
      filter,
      { ...updates, updated_at: Date.now() },
      { new: true }
  );
};

exports.deleteNote = async (noteId) => Note.findByIdAndDelete(noteId);
